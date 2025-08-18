
const { WebhookClient } = require("dialogflow-fulfillment");
const db = require("../utils/firebase");  // conexión a Firestore
const { ConsultarEstadoPedido } = require("../services/consultarEstadoPedido");


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

    // --- INTENCIÓNES 
    // CONSULTAR ESTADO DE PEDIDO
    function handlerConsultarEstadoPedido(agent) {
        const { codigo_seguimiento } = agent.parameters;

        // 1. Verificar que el usuario dio un código
        if (!codigo_seguimiento || codigo_seguimiento.trim() === "") {
            agent.add("Por favor, indícame tu código de seguimiento para poder buscar tu pedido.");
            return;
        }

        // 2. Llamar a la función de servicio y obtener resultado
        const resultado = ConsultarEstadoPedido(codigo_seguimiento);

        // 3. Responder al usuario
        agent.add(resultado.mensaje);
    }
    // SALUDO
    function handlerSaludo(agent) {
        const saludo = botConfig?.respuestas?.saludo || "Hola!";
        agent.add(saludo);
    }
    // DESPEDIDA
    function handlerDespedida(agent) {
        const despedida = botConfig?.respuestas?.despedida || "Adios!";
        agent.add(despedida);
    }

    // Mapeo de intenciones
    const intentMap = new Map();
    intentMap.set("ConsultarEstadoPedido", handlerConsultarEstadoPedido);
    intentMap.set("saludo", handlerSaludo);
    intentMap.set("Despedida", handlerDespedida);

    // Handler de intenciones desconocidas para evitar errores
    agent.handleRequest(intentMap);
}

module.exports = { fulfillmentHandler };


