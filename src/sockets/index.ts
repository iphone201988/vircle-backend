import { Socket, DefaultEventsMap, Server } from "socket.io";
import { countTokens, moderateContent, TryCatch } from "../utils/helper";
import jwt, { JwtPayload } from "jsonwebtoken";
import AiContact from "../models/aiContact.model";
import { fetchRelevantContext, storeInVectorDB } from "../services/rag.service";
import { chatWithContext } from "../services/gpt.service";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import User from "../models/user.model";
interface CustomSocket extends Socket {
  userId: string;
}

const useSocket = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  const users = new Map<string, string>();

  const addUser = (userId: string, socketId: string) => {
    users.set(userId, socketId);
  };

  const removeUser = (socketId: string) => {
    users.forEach((value, key) => {
      if (value === socketId) {
        users.delete(key);
      }
    });
  };


  const getUser = (userId: string) => {
    return users.get(userId);
  };

  io.use(async (socket: CustomSocket, next) => {
    const token = socket.handshake.headers.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decode = (await jwt.verify(
        token,
        process.env.JWT_SECRET!
      )) as JwtPayload;

      if (!decode) return next(new Error("Authentication error"));

      socket.userId = decode.userId;
      next();
    } catch (error) {
      return next(new Error("Authentication error. Invalid token"));
    }
  });

  io.on("connection", (socket: CustomSocket) => {
    addUser(socket.userId, socket.id);

    socket.on(
      "send_message",
      async (payload: { message: string; chatId: string }) => {
        console.log("payload", payload);
        const { message, chatId } = payload;
        const userId = socket.userId;
        if (!message || !chatId) {
          return socket.emit("error", "Message and contactId are required");
        }
        try {
          const user = await User.findById(userId);
          const chat = await Chat.findById(chatId);
          if (!chat) {
            return socket.emit("error", "Chat not found");
          }
          const contactId = chat.contactId;
          // Check rate limit (free/premium quota)
          //   const rateLimitOk = await checkRateLimit(userId);
          //   if (!rateLimitOk) {
          //     return res.status(429).json({ error: "Rate limit exceeded" });
          //   }

          const tokenCount = await countTokens(message);
          if (tokenCount > 500) {
            return socket.emit(
              "error",
              "Message must be between 300 and 500 tokens"
            );
          }

          const persona = await AiContact.findOne({ _id: contactId, userId });
          if (!persona) {
            return socket.emit("error", "AI contact not found");
          }

          const context = await fetchRelevantContext(
            message,
            userId,
            contactId.toString()
          );

          const userMessage = await Message.create({
            chatId,
            userId,
            type: "user",
            message,
            isRead: true,
          });
          chat.lastMessage = userMessage._id;
          chat.hasUnreadMessages = true;
          await chat.save();

          const reply = await chatWithContext(message, context, persona , user);

          const moderationResult = await moderateContent(reply);
          if (!moderationResult.isSafe) {
            return socket.emit(
              "error",
              "Response contains inappropriate content"
            );
          }
          if (reply) {
            const chatMessage = await Message.create({
              chatId,
              aiContactId: contactId,
              type: "ai",
              message: reply,
              isRead: false,
            });
            chat.lastMessage = chatMessage._id;
            chat.hasUnreadMessages = false;
            await chat.save();
            await storeInVectorDB(message, reply, userId, contactId.toString());
            socket.emit("receiveMessage", chatMessage);
          }else{
            return socket.emit(
              "error",
              "Response contains inappropriate content"
            );
          }
        
        } catch (error) {
          console.log("error:::", error);
          return socket.emit(
            "error",
            "An error occurred while sending the message"
          );
        }
      }
    );

    socket.on("disconnect", () => {
      removeUser(socket.id);
    });
  });
  return {getUser};
};

export default useSocket;
