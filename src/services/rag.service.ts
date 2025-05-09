import { getEmbedding } from "../utils/embedUtil";
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index("chat-history");

export const fetchRelevantContext = async (
  text: string,
  userId: string,
  contactId: string
) => {
  const queryEmbedding = await getEmbedding(text);

  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,
    filter: { userId, contactId }, 
  });

  const contextTexts = queryResponse.matches.map((m) => m.metadata.text);
  return contextTexts.join("\n");
};

export const storeInVectorDB = async (
    message: string,
    reply: string,
    userId: string,
    contactId: string
  ) => {
    const text = `${message}\n${reply}`;
    const embedding = await getEmbedding(text);
  
    await index.upsert([
      {
        id: `${userId}-${contactId}-${Date.now()}`, // Unique ID
        values: embedding,
        metadata: { text, userId, contactId },
      },
    ]);
  };