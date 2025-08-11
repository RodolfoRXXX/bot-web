
const { WebhookClient } = require("dialogflow-fulfillment");
const { ConsultarEstadoPedido } = require("../services/consultarEstadoPedido");

function fulfillmentHandler(req, res) {
    const agent = new WebhookClient({ request: req, response: res });

    // --- INTENCIÓN: CONSULTAR ESTADO DE PEDIDO ---
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

    // Mapeo de intenciones
    const intentMap = new Map();
    intentMap.set("ConsultarEstadoPedido", handlerConsultarEstadoPedido);

    // Handler de intenciones desconocidas para evitar errores
    agent.handleRequest(intentMap);
}

module.exports = { fulfillmentHandler };


