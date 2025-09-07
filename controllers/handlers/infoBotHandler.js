/*
    Bot que devuelve información
*/

const { Payload } = require("dialogflow-fulfillment");

module.exports = function(botConfig) {
  const intentMap = new Map();

  intentMap.set("saludo", (agent) => {
    agent.add(botConfig.respuestas?.saludo || "Intente nuevamente");
  });

  intentMap.set("informacion_empresa", (agent) => {
    agent.add(botConfig.respuestas?.informacion_empresa || "Intente nuevamente");
  });

  intentMap.set("horario", (agent) => {
    agent.add(botConfig.respuestas?.horario || "Intente nuevamente");
  });

  intentMap.set("contacto", (agent) => {
    const contacto = botConfig?.respuestas?.contacto;

    if (contacto) {
      agent.add(new Payload(agent.UNSPECIFIED, contacto, {
        sendAsMessage: true,
        rawPayload: true
      }));
    } else {
      agent.add("Intente nuevamente");
    }
  });

  intentMap.set("direccion", (agent) => {
    agent.add(botConfig?.respuestas?.ubicacion || "Intente nuevamente");
  });

  intentMap.set("servicios", (agent) => {
    agent.add(botConfig?.respuestas?.servicios || "Intente nuevamente");
  });

  intentMap.set("Despedida", (agent) => {
    agent.add(botConfig.respuestas?.despedida || "¡Hasta luego!");
  });

  return intentMap;
};
