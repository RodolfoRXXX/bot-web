
const { WebhookClient } = require("dialogflow-fulfillment");
const { recomendarRestaurantes } = require("../services/recomendadorService");

function fulfillmentHandler(req, res) {
    const agent = new WebhookClient({ request: req, response: res });

    function handlerRecomendacion(agent) {
        let { tipocomida, zona } = agent.parameters;
        const outputContexts = agent.contexts;

        tipocomida = Array.isArray(tipocomida) ? tipocomida[0] : tipocomida;
        zona = Array.isArray(zona) ? zona[0] : zona;

        if (!tipocomida) {
            const ctx = outputContexts.find(c => c.name.includes("esperando_zona"));
            tipocomida = ctx?.parameters?.tipocomida;
        }

        if (!zona) {
            const ctx = outputContexts.find(c => c.name.includes("esperando_comida"));
            zona = ctx?.parameters?.zona;
        }

        const respuesta = recomendarRestaurantes(tipocomida, zona);
        agent.add(respuesta);
    }

    const intentMap = new Map();
    intentMap.set("RecomendarRestaurante", handlerRecomendacion);
    agent.handleRequest(intentMap);
}

module.exports = { fulfillmentHandler };