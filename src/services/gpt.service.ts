import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import { appendGuidelinesToPrompt, buildUserInfoPrompt } from "../utils/promptBuilder";

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
    console.error('Error creating persona:', error);
    return { success: false, message: 'Failed to create persona due to API error' };
  }
}

export async function chatWithContext(message: string, context: string, persona: any , user:any) {
  const userInfo = await buildUserInfoPrompt(user);
  const guideLines =await appendGuidelinesToPrompt(persona.expertise)
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
    Respond empathetically and in a way that aligns with your persona context.
    User Information:
    ${userInfo}
    Guidelines: ${guideLines}
    Past conversation context: ${context}
    User message: ${message}
  `;
  
  console.log('personaPrompt',personaPrompt);

  
  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: personaPrompt }],
  });

  return res.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
}