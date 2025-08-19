
const { WebhookClient } = require("dialogflow-fulfillment");
const db = require("../utils/firebase");  // conexión a Firestore
const handler = require("./handlers");


async function fulfillmentHandler(req, res) {
    const agent = new WebhookClient({ request: req, response: res });

    // Obtener el siteId (de la request)
    const siteId = req.body.siteId || 
               req.body.originalDetectIntentRequest?.payload?.siteId || 
               "bot123";

    console.log("siteId es: ", siteId);

    // Traer configuración del bot desde Firestore
    let botConfig = null;
    try {
        const doc = await db.collection("bots").doc(siteId).get();
        if (doc.exists) {
            botConfig = doc.data();
            console.log("Config del bot: ", botConfig);
        } else {
            console.warn("No existe bot con ID: ", siteId);
        }
    } catch (error) {
        console.error("Error al obtener bot: ", error);
    }

    // Mapeo de intenciones con botConfig inyectado
    const intentMap = new Map();
    intentMap.set("saludo", (a) => handler.saludo(a, botConfig));
    intentMap.set("Despedida", (a) => handler.despedida(a, botConfig));
    intentMap.set("horario", (a) => handler.horario(a, botConfig));
    intentMap.set("telefono", (a) => handler.telefono(a, botConfig));
    intentMap.set("redes", (a) => handler.redes(a, botConfig));

    // Handler de intenciones desconocidas para evitar errores
    agent.handleRequest(intentMap);
}

module.exports = { fulfillmentHandler };


