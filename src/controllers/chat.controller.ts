import { SUCCESS, TryCatch } from "../utils/helper";
import Chat from "../models/chat.model";

import { NextFunction, Request, Response } from "express";
import Message from "../models/message.model";
import mongoose from "mongoose";
// // const sendMessage = TryCatch(
// //   async (req: Request, res: Response, next: NextFunction) => {
// //     const { message, contactId } = req.body;
// //     const { userId } = req;

// //     // Validate inputs
// //     if (!message || !contactId) {
// //       return res
// //         .status(400)
// //         .json({ error: "Message and contactId are required" });
// //     }

// //     // Check rate limit (free/premium quota)
// //     //   const rateLimitOk = await checkRateLimit(userId);
// //     //   if (!rateLimitOk) {
// //     //     return res.status(429).json({ error: "Rate limit exceeded" });
// //     //   }

// //     // Count tokens
// //     const tokenCount = await countTokens(message);
// //     if (tokenCount > 500) {
// //       return res
// //         .status(400)
// //         .json({ error: "Message must be between 300 and 500 tokens" });
// //     }

// //     // Validate AI contact belongs to user
// //     const persona = await AiContact.findOne({ _id: contactId, userId });
// //     if (!persona) {
// //       return res
// //         .status(404)
// //         .json({ error: "AI contact not found or not owned by user" });
// //     }

// //     // Fetch context using RAG
// //     const context = await fetchRelevantContext(message, userId, contactId); // Update to filter by contactId
// //  console.log('context===============',context);
// //     // Generate reply
// //     const reply = await chatWithContext(message, context, persona);

// //     // Moderate response
// //     const moderationResult = await moderateContent(reply);
// //     if (!moderationResult.isSafe) {
// //       return res
// //         .status(400)
// //         .json({ error: "Response contains inappropriate content" });
// //     }

// //     // Save message and reply to database
// //     const chat = await Chat.create({
// //       userId,
// //       contactId,
// //       message,
// //       reply,
// //       timestamp: new Date(),
// //     });

// //     // Save to VectorDB (Pinecone)
// //     await storeInVectorDB(message, reply, userId, contactId);

// //     return res.status(200).json({ reply, chatId: chat._id });
// //   }
// // );

// export default {
//   sendMessage,
// };

const getChats = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, userId } = req;

    const chats = await Chat.find({ userId: user._id })
      .select("-__v")
      .populate({
        path: "contactId",
        select: "name avatar",
      })
      .populate({
        path: "userId",
        select: "name email avatar",
      })
      .populate({
        path: "lastMessage",
        select: "message",
      });

    const enhancedChats = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          isRead: false,
          type: "ai", // Only count unread AI messages
        });

        return {
          ...chat.toObject(),
          unreadCount,
        };
      })
    );
    return SUCCESS(res, 200, "Chats fetched successfully", {
      data: {
        chats: enhancedChats,
      },
    });
  }
);

const getChatMessages = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId } = req.params;
    console.log("chatId", chatId);
    const chatIdObjectId = new mongoose.Types.ObjectId(chatId);

    await Message.updateMany(
      {
        chatId: chatIdObjectId,
        type: "ai",
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    await Chat.findByIdAndUpdate(chatId, {
      $set: { hasUnreadMessages: false },
    });

    const messages = await Message.find({ chatId }).select("-__v");

    return SUCCESS(res, 200, "Messages fetched successfully", {
      data: {
        messages,
      },
    });
  }
);

export default {
  getChats,
  getChatMessages,
};
