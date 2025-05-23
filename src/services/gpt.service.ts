import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import {
  appendGuidelinesToPrompt,
  buildUserInfoPrompt,
  reminderInstructions,
} from "../utils/promptBuilder";
import Reminder from "../models/reminder.model";

export async function createPersona(prompt: string) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
    });

    const reply = res.choices[0]?.message?.content || "{}";
    const result = JSON.parse(reply);

    if (result.status === "SUCCESS") {
      return { success: true, personaDetails: result.personaDescription };
    }
    return { success: false, message: result.message || "Unknown error" };
  } catch (error) {
    console.error("Error creating persona:", error);
    return {
      success: false,
      message: "Failed to create persona due to API error",
    };
  }
}


export async function chatWithContext(
  message: string,
  context: string,
  persona: any,
  user: any,
  chatId: string,
  tokenCount: any,
  options: { temperature?: number; top_p?: number; max_tokens?: number } = {}
) {
  const today = new Date();
  const userInfo = await buildUserInfoPrompt(user);
  const guideLines = await appendGuidelinesToPrompt(persona.expertise);
  const reminders = await reminderInstructions(chatId);
  const personaPrompt = `
    You are an AI persona named ${persona.name}, acting as an emotional support friend.
    Persona Details:
    - Age: ${persona.age}
    - Gender: ${persona.gender}
    - Relationship: ${persona.relationship}
    - Expertise: ${persona.expertise}
    - Language: ${persona.languagePreference}
    - Description: ${persona.description}
    - Persona Context: ${persona?.personaContext}
    You are here to make conversations flow smoothly, respond naturally, and be someone the user enjoys talking to.
    Respond empathetically and in a way that aligns with your persona context.
    Your tone is:
    -Friendly but not overly emotional
    -Supportive, engaging, and curious
    -Conversational — like texting with a very emotionally intelligent assistant or co-pilot
    User Information:
    ${userInfo}
    Guidelines: ${guideLines}
    Today's date is: ${today}
    Reminder Instructions: ${reminders}
    Past conversation context: ${context}
    User message: ${message}
  `;

  const temperature = options.temperature ?? 0.7;
  const top_p = options.top_p ?? 0.9;
  const max_tokens = options.max_tokens ?? 300;
  let res;
  try {
    res = await openai.chat.completions.create({
      model: tokenCount > 200 ? "gpt-4o-mini" : "gpt-4",
      messages: [{ role: "system", content: personaPrompt }],
      temperature: temperature,
      top_p,
      max_tokens,
    });
  } catch (error) {
     if (error.status === 429) {
    console.error("OpenAI quota exceeded.");
    return "OpenAI quota exceeded.";
  } else {
    console.error("OpenAI error:", error);
    return "Something went wrong while generating a response. Please try again.";
  }
  }
  let reminderData = null;
  let aiResponse =
    res.choices[0]?.message?.content ||
    "Sorry, Currently I am unable.";

  const reminderRegex = /<reminder_json>(.*?)<\/reminder_json>/s;
  const match = aiResponse.match(reminderRegex);

  if (match) {
    const reminderJson = JSON.parse(match[1]);
    reminderData = reminderJson.reminderData;

    aiResponse = aiResponse.replace(reminderRegex, "").trim();

    if (reminderData && chatId) {
      if (reminderData._id) {
        const reminder = await Reminder.findById(reminderData._id);
        reminder.isSent = reminderData.isSent
          ? reminderData.isSent
          : reminder.isSent;
        reminder.reminderDate = reminderData.reminderDate
          ? reminderData.reminderDate
          : reminder.reminderDate;
        await reminder.save();
      } else {
        const reminder = await Reminder.create({
          userId: user._id,
          reminderDate: reminderData.reminderDate,
          task: reminderData.task,
          chatId,
        });
        console.log("reminder", reminderData.reminderDate);
        console.log("Reminder created:", reminder);
      }
    }
  }
  return aiResponse;
}
