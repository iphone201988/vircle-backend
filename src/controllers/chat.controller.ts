import { SUCCESS, TryCatch } from "../utils/helper";
import Chat from "../models/chat.model";

import { NextFunction, Request, Response } from "express";
import Message from "../models/message.model";
import mongoose from "mongoose";
import ErrorHandler from "../utils/ErrorHandler";

const getChats = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, userId } = req;
    const search = req.query.search?.toString().trim().toLowerCase();
   
    let chats = await Chat.find({ userId: user._id , isDeleted:false })
      .select("-__v")
      .populate({
        path: "contactId",
        select: "name avatar aiAvatar",
      })
      .populate({
        path: "userId",
        select: "name email avatar",
      })
      .populate({
        path: "lastMessage",
        select: "message createdAt",
      });


    chats = chats.sort((a, b) => {
      const dateA = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const dateB = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return dateB - dateA; // Descending order
    });

    if (search) {
      chats = chats.filter((chat) =>
        chat.contactId?.name?.toLowerCase().includes(search)
      );
    }

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
    if(!chatId) return next(new ErrorHandler("Chat id is required", 400));
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
