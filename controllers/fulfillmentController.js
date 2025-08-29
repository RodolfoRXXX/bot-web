
const { WebhookClient } = require("dialogflow-fulfillment");
const db = require("../utils/firebase");  // conexión a Firestore


async function fulfillmentHandler(req, res) {
    const agent = new WebhookClient({ request: req, response: res });

    // Obtener el siteId (de la request)
    const siteId = req.body.siteId || 
               req.body.originalDetectIntentRequest?.payload?.siteId || 
               "defaultBot";

    console.log("siteId es: ", siteId);

    try {
        const doc = await db.collection("bots").doc(siteId).get();
        const botConfig = doc.data();
        if (!doc.exists) {
            console.warn("No existe bot con ID:", siteId);
            return res.status(404).send("Bot no encontrado");
        }

        // 🔑 Carga dinámica del archivo de handlers según el tipo
        const botType = botConfig.config.tipo || "default"; 
        const getIntentMap = require(`./handlers/${botType}BotHandler.js`);

        const intentMap = getIntentMap(botConfig);
        agent.handleRequest(intentMap);
    } catch (error) {
        console.error("Error al obtener el bot:", error);
        res.status(500).send("Error interno del servidor");
    }
}

module.exports = { fulfillmentHandler };
