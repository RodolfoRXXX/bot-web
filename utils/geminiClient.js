const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY no está configurada en el archivo .env");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const chats = new Map(); // Para almacenar el historial de conversación por sesión

async function sendMessageToGemini(sessionId, message, systemPrompt) {
  try {
    let chat = chats.get(sessionId);

    if (!chat) {
      chat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 500,
        },
      });
      chats.set(sessionId, chat);
      if (systemPrompt) {
        // Add system prompt to history if provided
        await chat.sendMessage(`(System prompt: ${systemPrompt})`);
      }
    }

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error al comunicarse con Gemini API:", error);
    throw error;
  }
}

module.exports = { sendMessageToGemini };
