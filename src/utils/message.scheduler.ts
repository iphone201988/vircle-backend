// import cron from "node-cron";
// import { chatWithContext } from "../services/gpt.service";
// import AiContact from "../models/aiContact.model";
// import Chat from "../models/chat.model";
// import Message from "../models/message.model";
// import User from "../models/user.model";

// import { Server as SocketIOServer } from "socket.io";
// import { fetchRelevantContext } from "../services/rag.service";

// const isWithinTimeWindow = (): boolean => {
//   const now = new Date();
//   const hours = now.getHours();
//   return hours >= 11 && hours <= 21; // 11 a.m. to 9 p.m.
// };

// const shouldSendMessage = (
//   lastSent: Date | null,
//   interval: string
// ): boolean => {
//   const now = new Date();
//   if (!lastSent) return true; // If no message has been sent, send one
//   const diffInMs = now.getTime() - lastSent.getTime();
//   const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

//   switch (interval) {
//     case "Daily":
//       return diffInDays >= 1;
//     case "Weekly":
//       return diffInDays >= 7;
//     case "Monthly":
//       const nowDay = now.getDate();
//       const sameMonth = now.getMonth() === lastSent.getMonth();
//       const sameYear = now.getFullYear() === lastSent.getFullYear();
//       const sentThisMonth = sameMonth && sameYear;

//       return nowDay >= 5 && nowDay <= 25 && !sentThisMonth;
//     case "Yearly":
//       const lastSentYear = lastSent.getFullYear();
//       return (
//         now.getFullYear() > lastSentYear &&
//         now.getMonth() === 9 &&
//         now.getDate() >= 9
//       ); // October 9th
//     default:
//       return false;
//   }
// };

// const generateScheduledMessage = async (
//   userId: any,
//   aiContact: any
// ): Promise<string> => {
//   const user = await User.findById(userId);
//   const context = await fetchRelevantContext(
//     "",
//     user._id.toString(),
//     aiContact._id.toString()
//   ); // You can fetch past conversation context if needed
//   console.log("scheduling context", context);
//   const messagePrompt = `
//       Generate a friendly, casual message to check in with the user. Ask how they are doing or catch up with something they were working on according to their last messages. Here are some ideas:
//       - "Hey , how are you doing today?"
//       - "Hi , have you been working on anything exciting lately?"
//     `;

//   return await chatWithContext(messagePrompt, context, aiContact, user);
// };

// export const startMessageScheduler = (
//   io: SocketIOServer,
//   getUser: (userId: string) => string | undefined
// ) => {
//   // Run every hour to check for messages to send
//   cron.schedule("0 * * * * *", async () => {
//     console.log("Running message scheduler...");
//     if (!isWithinTimeWindow()) return; // Only send messages between 11 a.m. and 9 p.m.

//     try {
//       const aiContacts = await AiContact.find({ isDeleted: false }).populate(
//         "userId"
//       );

//       for (const aiContact of aiContacts) {
//         if (aiContact.canTextEvery === "Never") continue;
//         const user = aiContact.userId;
//         // Find or create a chat for this user and AI contact
//         let chat = await Chat.findOne({
//           userId: user._id,
//           contactId: aiContact._id,
//         }).populate({
//           path: "lastMessage",
//           select: "message createdAt",
//         });
//         if (!chat) {
//           chat = await Chat.create({
//             userId: user._id,
//             contactId: aiContact._id,
//           });
//         }
//         if (!user) continue;

//         // Check if it's time to send a message
//         // console.log("chat Id ", chat._id);
//         // console.log('contact Id ', aiContact._id);
//         if (
//           !shouldSendMessage(
//             chat?.lastMessage?.createdAt,
//             aiContact.canTextEvery
//           )
//         )
//           continue;
//         console.log("After chat Id ", chat._id);
//         console.log("After contact Id ", aiContact._id);
        
//         // Generate and send the message
//         const messageContent = await generateScheduledMessage(user, aiContact);
        

//         const chatMessage = await Message.create({
//           chatId: chat._id,
//           aiContactId: aiContact._id,
//           type: "ai",
//           message: messageContent,
//           isRead: false,
//         });

//         chat.lastMessage = chatMessage._id;
//         chat.hasUnreadMessages = true;
//         await chat.save();
//         const socketId = getUser(user._id.toString());

//         io.to(socketId).emit("receiveMessage", chatMessage);
//       }
//     } catch (error) {
//       console.error("Error in message scheduler:", error);
//     }
//   });
// };
