import User from "../models/user.model";
import { chatWithContext } from "../services/gpt.service";
import { fetchRelevantContext } from "../services/rag.service";


export const isWithinTimeWindow = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  return hours >= 11 && hours <= 21; // 11 a.m. to 9 p.m.
};


export const shouldSendMessage = (
  lastSent: Date | null,
  interval: string
): boolean => {
  const now = new Date();
  if (!lastSent) return true;
  const diffInMs = now.getTime() - lastSent.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  switch (interval) {
    case "Daily":
      return diffInDays >= 1;
    case "Weekly":
      return diffInDays >= 7;
    case "Monthly":
      const nowDay = now.getDate();
      const sameMonth = now.getMonth() === lastSent.getMonth();
      const sameYear = now.getFullYear() === lastSent.getFullYear();
      const sentThisMonth = sameMonth && sameYear;
      return nowDay >= 5 && nowDay <= 25 && !sentThisMonth;
    case "Yearly":
      const lastSentYear = lastSent.getFullYear();
      return (
        now.getFullYear() > lastSentYear &&
        now.getMonth() === 9 &&
        now.getDate() >= 9
      );
    default:
      return false;
  }
};


export const generateScheduledMessage = async (
  userId: any,
  aiContact: any
): Promise<string> => {
  const user = await User.findById(userId);
  const context = await fetchRelevantContext(
    "",
    user._id.toString(),
    aiContact._id.toString()
  );
  console.log("scheduling context", context);
  const messagePrompt = `
      Generate a friendly, casual message to check in with the user. Ask how they are doing or catch up with something they were working on according to their last messages. Here are some ideas:
      - "Hey, how are you doing today?"
      - "Hi, have you been working on anything exciting lately?"
    `;
  return await chatWithContext(messagePrompt, context, aiContact, user ,null,0);
};