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

  intentMap.set("email", (agent) => {
    agent.add(botConfig?.respuestas?.email || "Intente nuevamente");
  });

  intentMap.set("servicios", (agent) => {
    agent.add(botConfig?.respuestas?.servicios || "Intente nuevamente");
  });

  intentMap.set("promociones", (agent) => {
    agent.add(botConfig?.respuestas?.promociones || "Intente nuevamente");
  });

  intentMap.set("politicas", (agent) => {
    agent.add(botConfig?.respuestas?.politicas || "Intente nuevamente");
  });

  // faq
  intentMap.set("formas_de_pago", (agent) => {
    agent.add(botConfig?.respuestas?.faq?.formas_de_pago || "Intente nuevamente");
  });

  intentMap.set("envios", (agent) => {
    agent.add(botConfig?.respuestas?.faq?.envios || "Intente nuevamente");
  });

  intentMap.set("devoluciones", (agent) => {
    agent.add(botConfig?.respuestas?.faq?.devoluciones || "Intente nuevamente");
  });

  intentMap.set("Despedida", (agent) => {
    agent.add(botConfig.respuestas?.despedida || "¡Hasta luego!");
  });

  return intentMap;
};
