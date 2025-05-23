// models/Reminder.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IReminder } from '../type/Database/types';

const ReminderSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },
    reminderDate: {
      type: Date,
      required: true,
      index: true 
    },
    task: {
      type: String,
      required: true
    },
    isSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

ReminderSchema.index({ isSent: 1, reminderDate: 1 });

const Reminder = mongoose.model<IReminder>('Reminder', ReminderSchema);

export default Reminder;