import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

// Initialize the Google Generative AI SDK
export const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = (modelName = "gemini-1.5-flash") => {
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is not defined in the environment. AI features will fail.");
  }
  return genAI.getGenerativeModel({ model: modelName });
};
