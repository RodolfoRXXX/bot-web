/*
    API backend bot
*/

const express = require("express");
const path = require("path");
const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");
require("dotenv").config();

const app = express();
const port = 3000;

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
