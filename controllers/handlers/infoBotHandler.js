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

  intentMap.set("faq", (agent) => {
    const faq = botConfig?.respuestas?.faqe;

    if (faq) {
      agent.add(new Payload(agent.UNSPECIFIED, faq, {
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

  intentMap.set("Default_Fallback_Intent", (agent) => {
      const replyPayload = {
        reply: {
          fields: {
            texto: { stringValue: "😕 No entendí lo que quisiste decir. ¿Querés enviarnos un mensaje?", kind: "stringValue" },
            medios: {
              listValue: {
                values: [
                  { stringValue: "Enviar mensaje al sitio|message", kind: "stringValue" }
                ]
              },
              kind: "listValue"
            }
          }
        }
      };

      // Enviamos como payload para que llegue estructurado y no como texto plano
      agent.add(
        new Payload(agent.UNSPECIFIED, replyPayload, { sendAsMessage: true })
      );
  });

  return intentMap;
};
