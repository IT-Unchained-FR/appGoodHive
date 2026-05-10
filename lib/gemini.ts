import { GoogleGenerativeAI } from "@google/generative-ai";

const normalizeModelName = (modelName: string) => modelName.replace(/^models\//, "");

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const getGeminiModel = (modelName = "gemini-2.0-flash") => {
  return getGeminiClient().getGenerativeModel({ model: normalizeModelName(modelName) });
};

export const getEmbedding = async (text: string) => {
  const model = getGeminiClient().getGenerativeModel({
    model: "gemini-embedding-001",
  });
  const result = await model.embedContent(text);
  return result.embedding.values;
};
