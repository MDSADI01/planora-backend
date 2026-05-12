// src/app/ai/ai.routes.ts
import express from "express";
import { getGeminiModel } from "../../lib/gemini";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const model = getGeminiModel();

    const result = await model.generateContent(`
      You are Planora's event assistant chatbot.
      Help users find events, understand booking, free/paid events, invitations, and recommendations.
      User message: ${message}
    `);

    res.json({
      success: true,
      data: result.response.text(),
    });
  } catch (err) {
    console.error("AI chatbot failed.", err);

    res.status(500).json({
      success: false,
      message: "AI chatbot failed",
    });
  }
});

export default router;
