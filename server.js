/*
    API backend bot
*/

const express = require("express");
const path = require("path");
const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");
const { WebhookClient } = require("dialogflow-fulfillment");
require("dotenv").config();

const app = express();
const port = 3000;

// Cargar el archivo JSON que emula una base de datos
const restaurantes = require("./restaurantes.json");

// Cargar el archivo de clave
const CREDENTIALS = require("./dialogflow-key.json");

// Configurar cliente de DialogFlow
const projectId = CREDENTIALS.project_id;
const sessionId = uuid.v4();
const sessionClient = new dialogflow.SessionsClient({
    credentials: {
        private_key: CREDENTIALS["private_key"],
        client_email: CREDENTIALS["client_email"],
    },
});
const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

// Middleware
app.use(express.json());
app.use(express.static("public")); // para servir el script JS

// Funciones

  function recomendarRestaurantes(tipoComida, zona) {
    const tipo = tipoComida?.toLowerCase();
    const lugar = zona?.toLowerCase();

    const lugares = restaurantes[tipo][lugar];
    console.log(lugares);

    if (lugares && lugares.length > 0) {
      return `Te recomiendo estos lugares de ${tipoComida} en ${zona}: ${lugares.join(", ")}.`;
    } else {
      return `No encontre restaurantes de ${tipoComida} en ${zona}. Querés que busque en otra zona o con otro tipo de comida?`;
    }
  }

// Ruta para el widget (iframe)
app.get("/widget", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "widget.html"));
});

// Ruta para manejar mensajes
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: message,
                languageCode: "es", // Español
            },
        },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    let reply = result.fulfillmentText;
    if (!reply && result.fulfillmentMessages && result.fulfillmentMessages.length > 0) {
    reply = result.fulfillmentMessages[0].text.text[0];
    }

    res.send({ reply: reply || 'No entendí eso.' });
    
  } catch (error) {
    console.error("Error con DialogFlow: ", error.message);
    res.status(500).json({ reply: "Error del bot al conectarse con DialogFlow." });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}/widget`);
});

app.post("/webhook", express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  function handleRecomendacion(agent) {

    const parameters = agent.parameters;
    const outputContexts = agent.contexts;

    // Intentar recuperar parámetros desde contextos anteriores
    const tipoComida = parameters.tipocomida?.[0] || parameters.tipocomida || '';
    const zona = parameters.zona?.[0] || parameters.zona || '';

    if (!tipoComida) {
      const contexto = outputContexts.find(ctx => ctx.name.includes('esperando_zona'));
      tipoComida = contexto?.parameters?.tipocomida;
    }

    if (!zona) {
      const contexto = outputContexts.find(ctx => ctx.name.includes('esperando_comida'));
      zona = contexto?.parameters?.zona;
    }

    console.log("Parametros recibidos:", agent.parameters);


    const respuesta = recomendarRestaurantes(tipoComida, zona);
    agent.add(respuesta);
  }

  let intentMap = new Map();
  intentMap.set("RecomendarRestaurante", handleRecomendacion);

  agent.handleRequest(intentMap);
});
