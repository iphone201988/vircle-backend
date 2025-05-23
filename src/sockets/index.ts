import { Socket, DefaultEventsMap, Server } from "socket.io";
import { countTokens, moderateContent, TryCatch } from "../utils/helper";
import jwt, { JwtPayload } from "jsonwebtoken";
import AiContact from "../models/aiContact.model";
import { fetchRelevantContext, storeInVectorDB } from "../services/rag.service";
import { chatWithContext } from "../services/gpt.service";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import User from "../models/user.model";
import { isUserAbusing } from "../utils/helper";
interface CustomSocket extends Socket {
  userId: string;
}

const useSocket = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  const users = new Map<string, string>();
  const messageBuffer = new Map<
    string,
    { messages: string[]; timeout: NodeJS.Timeout }
  >();

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
        const { message, chatId } = payload;
        const userId = socket.userId;
        if (!message || !chatId) {
          return socket.emit("error", "Message and chatId are required");
        }
        const bufferTimeout = isUserAbusing(userId) ? 10000 : 3000;
        console.log(`User ${userId} buffer timeout set to ${bufferTimeout}ms`);
        const bufferKey = `${userId}-${chatId}`;
        const existingBuffer = messageBuffer.get(bufferKey);

        if (existingBuffer) {
          existingBuffer.messages.push(message);
          clearTimeout(existingBuffer.timeout);
        } else {
          messageBuffer.set(bufferKey, {
            messages: [message],
            timeout: setTimeout(() => {}, 0),
          });
        }

        messageBuffer.get(bufferKey)!.timeout = setTimeout(async () => {
          console.log(`Processing buffered messages for user ${userId}, chat ${chatId}`);
          const bufferedMessages = messageBuffer.get(bufferKey)!.messages;
          const combinedMessage = bufferedMessages.join("\n");

          messageBuffer.delete(bufferKey);

          try {
            const user = await User.findById(userId);
            const chat = await Chat.findById(chatId);
            if (!chat) {
              return socket.emit("error", "Chat not found");
            }
            const contactId = chat.contactId;

            const tokenCount = await countTokens(combinedMessage);
            console.log("tokenCount", tokenCount);
            if (tokenCount > 300) {
              console.log("Combined message must be between 300 and 500 tokens");
              return socket.emit(
                "error",
                "Combined message must be between 300 and 500 tokens"
              );
            }

            const persona = await AiContact.findOne({ _id: contactId, userId });
            if (!persona) {
              return socket.emit("error", "AI contact not found");
            }

            const context = await fetchRelevantContext(
              combinedMessage,
              userId,
              contactId.toString()
            );

            const userMessage = await Message.create({
              chatId,
              userId,
              type: "user",
              message: combinedMessage,
              isRead: true,
            });
            chat.lastMessage = userMessage._id;
            chat.hasUnreadMessages = true;
            await chat.save();

            const reply = await chatWithContext(
              combinedMessage,
              context,
              persona,
              user,
              chatId,
              tokenCount,
              {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 500,
              }
            );

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
              await storeInVectorDB(
                combinedMessage,
                reply,
                userId,
                contactId.toString()
              );
              socket.emit("receiveMessage", chatMessage);
            } else {
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
        }, bufferTimeout);
      }
    );

    socket.on("readMessage", async (payload: { chatId: string }) => {
      try {
        const { chatId } = payload;
        const messages = await Message.updateMany(
          { chatId, isRead: false },
          { $set: { isRead: true } }
        );
        console.log("Messages updated:", messages);
      } catch (error) {
        console.log("error:::", error);
        return socket.emit(
          "error",
          "An error occurred while reading the message"
        );
      }
    });

    socket.on("disconnect", () => {
      removeUser(socket.id);
    });
  });
  return { getUser };
};

export default useSocket;
