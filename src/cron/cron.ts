import cron from "node-cron";
import { chatWithContext } from "../services/gpt.service";
import AiContact from "../models/aiContact.model";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import User from "../models/user.model";
import { Server as SocketIOServer } from "socket.io";
import { fetchRelevantContext } from "../services/rag.service";

import {
  isWithinTimeWindow,
  shouldSendMessage,
  generateScheduledMessage,
} from "./cron.utills";
import Reminder from "../models/reminder.model";

let isCronRunning = false;
let isReminderCronRunning = false;

const processReminders = async (io: SocketIOServer, getUser) => {
  const runId =
    Date.now().toString() + Math.random().toString(36).substring(2, 8);
  console.log(
    `Running reminder processor at ${new Date().toISOString()} with run ID ${runId}...`
  );

  try {
    const now = new Date();

    const dueReminders = await Reminder.find({
      isSent: false,
      reminderDate: { $lte: now },
    })
      .populate("userId")
      .populate("chatId");

    console.log(`Run ${runId} - Found ${dueReminders.length} due reminders`);

    for (const reminder of dueReminders) {
      try {
        if (!reminder.chatId || !reminder.userId) {
          console.log(
            `Run ${runId} - Reminder ${reminder._id} has missing userId or chatId, skipping`
          );
          continue;
        }

        const user = reminder.userId;
        const chat = reminder.chatId;

        const aiContact = await AiContact.findById(chat.contactId);
        if (!aiContact) {
          console.log(
            `Run ${runId} - No AI contact found for chat ${chat._id}, skipping reminder ${reminder._id}`
          );
          continue;
        }
      
        // const reply = await chatWithContext("Create Short friendly reminder message.Reminder Task is :"+reminder.task,"No Context", aiContact, user, chat._id);
        // console.log('=================================Reply Reminder',reply);
        const reminderMessage = `Hi there! It's time to : ${reminder.task}`;

        await Chat.findByIdAndUpdate(chat._id, {
          $set: { hasUnreadMessages: true },
        });

        const chatMessage = await Message.create({
          chatId: chat._id,
          aiContactId: aiContact._id,
          type: "ai",
          message: reminderMessage,
          isRead: false,
          isReminder: true,
          relatedReminderId: reminder._id,
        });

        console.log(
          `Run ${runId} - Created reminder message ${chatMessage._id} for chat ${chat._id}`
        );

        await Chat.findByIdAndUpdate(chat._id, {
          lastMessage: chatMessage._id,
        });

        reminder.isSent = true;
        await reminder.save();
        console.log(`Run ${runId} - Marked reminder ${reminder._id} as sent`);

        const socketId = getUser(user._id.toString());
        if (socketId) {
          console.log(
            `Run ${runId} - Emitting reminder message to socket ${socketId} for user ${user._id}`
          );
          io.to(socketId).emit("receiveMessage", chatMessage);
        } else {
          console.log(`Run ${runId} - No socket found for user ${user._id}`);
        }
      } catch (error) {
        console.error(
          `Run ${runId} - Error processing reminder ${reminder._id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error(`Run ${runId} - Error in reminder processor:`, error);
  } finally {
    isReminderCronRunning = false;
  }
};

const canTextEveryFun = async (io: SocketIOServer, getUser) => {
  const runId =
    Date.now().toString() + Math.random().toString(36).substring(2, 8);
  console.log(
    `Running message scheduler at ${new Date().toISOString()} with run ID ${runId}...`
  );
  try {
    if (!isWithinTimeWindow()) {
      console.log("Outside time window (11 AM - 9 PM), skipping...");
      return;
    }

    const aiContacts = await AiContact.find({ isDeleted: false }).populate(
      "userId"
    );
    console.log(`Run ${runId} - Found ${aiContacts.length} AI contacts`);

    // Check for duplicate AI contacts
    const aiContactIds = aiContacts.map((contact) => contact._id.toString());
    const uniqueAiContactIds = new Set(aiContactIds);
    if (aiContactIds.length !== uniqueAiContactIds.size) {
      console.log(`Run ${runId} - Duplicate AI Contacts found:`);
      const idCountMap = {};
      aiContactIds.forEach((id) => {
        idCountMap[id] = (idCountMap[id] || 0) + 1;
        if (idCountMap[id] > 1) {
          console.log(`AI Contact ID ${id} appears ${idCountMap[id]} times`);
        }
      });
    }

    const processedChatIds = new Set();

    for (const aiContact of aiContacts) {
      if (aiContact.canTextEvery === "Never") {
        console.log(
          `Run ${runId} - Skipping AI contact ${aiContact._id}: canTextEvery is Never`
        );
        continue;
      }
      const user = aiContact.userId;

      let chat = await Chat.findOne({
        userId: user._id,
        contactId: aiContact._id,
      }).populate("lastMessage");

      if (!chat) {
        chat = await Chat.create({
          userId: user._id,
          contactId: aiContact._id,
        });
        console.log(
          `Run ${runId} - Created new chat ${chat._id} for user ${user._id} and contact ${aiContact._id}`
        );
      }
      if (!user) {
        console.log(
          `Run ${runId} - No user found for AI contact ${aiContact._id}`
        );
        continue;
      }

      if (processedChatIds.has(chat._id.toString())) {
        console.log(
          `Run ${runId} - Chat ${chat._id} already processed in this run, skipping`
        );
        continue;
      }

      if (
        !shouldSendMessage(chat?.lastMessage?.createdAt, aiContact.canTextEvery)
      ) {
        console.log(
          `Run ${runId} - Skipping message for chat ${chat._id}, interval not met`
        );
        continue;
      }
      console.log(
        "=============================================================",
        chat?.lastMessage?.createdAt,
        aiContact.canTextEvery
      );
      const updatedChat = await Chat.findOneAndUpdate(
        {
          _id: chat._id,
          lastMessage: chat.lastMessage ? chat.lastMessage._id : null,
        },
        { $set: { hasUnreadMessages: true } },
        { new: true }
      );

      if (!updatedChat) {
        console.log(
          `Run ${runId} - Chat ${chat._id} was updated by another process or condition failed, skipping`
        );
        console.log(
          `Run ${runId} - Expected lastMessage: ${
            chat.lastMessage ? chat.lastMessage._id : null
          }`
        );
        const currentChat = await Chat.findById(chat._id).populate(
          "lastMessage"
        );
        console.log(
          `Run ${runId} - Current lastMessage: ${
            currentChat.lastMessage ? currentChat.lastMessage._id : null
          }`
        );
        continue;
      }

      const messageContent = await generateScheduledMessage(user, aiContact);
      console.log(
        `Run ${runId} - Generated message for user ${user._id}, contact ${aiContact._id}: ${messageContent}`
      );

      const existingMessages = await Message.find({ chatId: chat._id })
        .sort({ createdAt: -1 })
        .limit(5);
      console.log(
        `Run ${runId} - Existing messages for chat ${chat._id} before creation:`,
        existingMessages
      );

      const chatMessage = await Message.create({
        chatId: chat._id,
        aiContactId: aiContact._id,
        type: "ai",
        message: messageContent,
        isRead: false,
      });
      console.log(
        `Run ${runId} - Created message ID ${chatMessage._id} for chat ${chat._id} at`
      );

      updatedChat.lastMessage = chatMessage._id;
      await updatedChat.save();
      console.log(
        `Run ${runId} - Updated chat ${chat._id} with lastMessage ${chatMessage._id}`
      );

      processedChatIds.add(chat._id.toString());

      const socketId = getUser(user._id.toString());
      if (socketId) {
        console.log(
          `Run ${runId} - Emitting message to socket ${socketId} for user ${user._id}`
        );
        io.to(socketId).emit("receiveMessage", chatMessage);
      } else {
        console.log(`Run ${runId} - No socket found for user ${user._id}`);
      }
    }
  } catch (error) {
    console.error(`Run ${runId} - Error in message scheduler:`, error);
  } finally {
    isCronRunning = false;
  }
};

export const startMessageScheduler = (
  io: SocketIOServer,
  getUser: (userId: string) => string | undefined
) => {
  cron.schedule("0 */2 * * * *", async () => {
    if (isCronRunning) {
      console.log("Cron already running, skipping...");
      return;
    }
    isCronRunning = true;
    await canTextEveryFun(io, getUser);
  });

  cron.schedule("*/1 * * * *", async () => {
    if (isReminderCronRunning) {
      console.log("Reminder cron already running, skipping...");
      return;
    }
    isReminderCronRunning = true;
    await processReminders(io, getUser);
  });
};
