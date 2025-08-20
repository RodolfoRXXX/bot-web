/*
    Bot que devuelve información
*/

module.exports = function(botConfig) {
  const intentMap = new Map();

  intentMap.set("horario", (agent) => {
    agent.add(botConfig.respuestas?.horario || "Intente nuevamente");
  });

  intentMap.set("telefono", (agent) => {
    agent.add(botConfig?.respuestas?.telefono || "Intente nuevamente");
  });

  intentMap.set("redes", (agent) => {
    agent.add(botConfig?.respuestas?.redes || "Intente nuevamente");
  });

  intentMap.set("Despedida", (agent) => {
    agent.add(botConfig.respuestas?.despedida || "¡Hasta luego!");
  });

  return intentMap;
};
