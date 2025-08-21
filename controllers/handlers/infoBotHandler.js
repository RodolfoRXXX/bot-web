/*
    Bot que devuelve información
*/

module.exports = function(botConfig) {
  const intentMap = new Map();

  intentMap.set("saludo", (agent) => {
    agent.add(botConfig.respuestas?.saludo || "Intente nuevamente");
  });

  intentMap.set("horario", (agent) => {
    agent.add(botConfig.respuestas?.horario || "Intente nuevamente");
  });

  intentMap.set("telefono", (agent) => {
    agent.add(botConfig?.respuestas?.telefono || "Intente nuevamente");
  });

  intentMap.set("redes", (agent) => {
    agent.add(botConfig?.respuestas?.redes || "Intente nuevamente");
  });

  intentMap.set("direccion", (agent) => {
    agent.add(botConfig?.respuestas?.direccion || "Intente nuevamente");
  });

  intentMap.set("sitioweb", (agent) => {
    agent.add(botConfig?.respuestas?.sitioWeb || "Intente nuevamente");
  });

  intentMap.set("Despedida", (agent) => {
    agent.add(botConfig.respuestas?.despedida || "¡Hasta luego!");
  });

  return intentMap;
};
