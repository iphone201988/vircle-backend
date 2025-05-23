import mongoose, { Schema } from "mongoose";
import { ChatModel } from "../type/Database/types";

const chatSchema = new Schema<ChatModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "AiContact",
      required: true,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    hasUnreadMessages: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ChatModel>("Chat", chatSchema);
