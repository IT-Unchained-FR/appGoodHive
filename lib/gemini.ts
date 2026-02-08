import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI } from "@google-cloud/vertexai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const vertexProject = process.env.VERTEX_AI_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
const vertexLocation = process.env.VERTEX_AI_LOCATION ?? "us-central1";

const normalizeModelName = (modelName: string) => modelName.replace(/^models\//, "");

const getVertexClient = () => {
  if (!vertexProject) {
    return null;
  }
  return new VertexAI({ project: vertexProject, location: vertexLocation });
};

const getGeminiClient = () => {
  if (!geminiApiKey) {
    return null;
  }
  return new GoogleGenerativeAI(geminiApiKey);
};

export const getGeminiModel = (modelName = "gemini-1.5-flash") => {
  const provider = (process.env.GEMINI_PROVIDER ?? "auto").toLowerCase();
  if (provider !== "gemini") {
    const vertexClient = getVertexClient();
    if (vertexClient) {
      return vertexClient.getGenerativeModel({ model: normalizeModelName(modelName) });
    }
    if (provider === "vertex") {
      throw new Error("Vertex AI is not configured for GEMINI_PROVIDER=vertex");
    }
  }

  const geminiClient = getGeminiClient();
  if (!geminiClient) {
    throw new Error("Vertex AI is not configured and GEMINI_API_KEY is not set");
  }

  return geminiClient.getGenerativeModel({ model: normalizeModelName(modelName) });
};

export const getVertexPreviewModel = (modelName = "gemini-1.5-flash") => {
  const vertexClient = getVertexClient();
  if (!vertexClient) {
    return null;
  }
  return vertexClient.preview.getGenerativeModel({ model: normalizeModelName(modelName) });
};

export const getEmbedding = async (text: string) => {
  const geminiClient = getGeminiClient();
  if (!geminiClient) {
    throw new Error("GEMINI_API_KEY is required for embeddings");
  }

  const model = geminiClient.getGenerativeModel({
    model: "models/gemini-embedding-001",
  });
  const result = await model.embedContent(text);
  return result.embedding.values;
};
