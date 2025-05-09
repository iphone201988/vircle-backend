import mongoose, { Schema } from "mongoose";
import { MessageModel } from "../type/Database/types";

const messageSchema = new Schema<MessageModel>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    aiContactId: {
      type: Schema.Types.ObjectId,
      ref: "AiContact",
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<MessageModel>("Message", messageSchema);
