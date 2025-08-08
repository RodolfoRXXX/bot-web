
const { WebhookClient } = require("dialogflow-fulfillment");
const { recomendarRestaurantes } = require("../services/recomendadorService");

function fulfillmentHandler(req, res) {
    const agent = new WebhookClient({ request: req, response: res });

    function handlerRecomendacion(agent) {
        let { tipocomida, zona } = agent.parameters;

        // Obtener parámetros de contextos previos si faltan
        const outputContexts = agent.contexts;

        if (!tipocomida) {
            const ctx = outputContexts.find(c => c.name.includes("esperando_comida"));
            tipocomida = ctx?.parameters?.tipocomida;
        }

        if (!zona) {
            const ctx = outputContexts.find(c => c.name.includes("esperando_zona"));
            zona = ctx?.parameters?.zona;
        }

        // Si aún falta algún dato, guardar contexto y pedirlo
        if (!tipocomida && zona) {
            agent.setContext({
                name: "esperando_comida",
                lifespan: 5,
                parameters: { zona }
            });
            agent.add("¿Qué tipo de comida te gustaría?");
            return;
        }

        if (!zona && tipocomida) {
            agent.setContext({
                name: "esperando_zona",
                lifespan: 5,
                parameters: { tipocomida }
            });
            agent.add("¿En qué zona estás buscando?");
            return;
        }

        if (!tipocomida && !zona) {
            agent.add("¿Qué tipo de comida y en qué zona estás buscando?");
            return;
        }

        // Ambos parámetros presentes → recomendar
        const respuesta = recomendarRestaurantes(tipocomida, zona);
        agent.add(respuesta);
    }

    const intentMap = new Map();
    intentMap.set("RecomendarRestaurante", handlerRecomendacion);
    agent.handleRequest(intentMap);
}

module.exports = { fulfillmentHandler };

