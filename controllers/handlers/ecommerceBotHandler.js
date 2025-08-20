/*
    Bot que devuelve información
*/

module.exports = function(botConfig) {
  const intentMap = new Map();

  intentMap.set("saludo", (agent) => {
    agent.add(botConfig.respuestas?.saludo || "Intente nuevamente");
  });

  intentMap.set("Despedida", (agent) => {
    agent.add(botConfig.respuestas?.despedida || "¡Hasta luego!");
  });

  return intentMap;
};
