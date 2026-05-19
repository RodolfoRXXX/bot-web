
const { sendMessageToGemini } = require("../utils/geminiClient");
const db = require("../utils/firebase");  // conexión a Firestore


async function fulfillmentHandler(req, res) {
    try {
        const siteId = req.body.session.split('/').pop(); // Extract siteId from session path
        const userMessage = req.body.queryResult.queryText;
        const sessionId = req.body.session;

        const doc = await db.collection("bots").doc(siteId).get();
        if (!doc.exists) {
            console.warn("No existe bot con ID:", siteId);
            return res.status(404).send("Bot no encontrado");
        }
        const botConfig = doc.data();
        const systemPrompt = botConfig.systemPrompt || "Eres un asistente de chatbot útil.";

        const geminiResponse = await sendMessageToGemini(sessionId, userMessage, systemPrompt);

        res.status(200).json({
            fulfillmentText: geminiResponse
        });

    } catch (error) {
        console.error("Error en fulfillmentHandler:", error);
        res.status(500).send("Error interno del servidor");
    }
}

module.exports = { fulfillmentHandler };
