
const express = require("express");
const path = require("path");
const { sessionClient } = require("../utils/dialogFlowClient");
const { fulfillmentHandler } = require("../controllers/fulfillmentController");
const db = require("../utils/firebase"); // <-- Asegurate de importar Firestore
const { jsonToStructProto } = require("../utils/jsonToStruct");

import nodemailer from "nodemailer";

const router = express.Router();

// Ruta widget
router.get("/widget", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/widget.html"));
});

// Ruta para obtener configuración del bot según siteId
router.get("/api/config/:siteId", async (req, res) => {
  const siteId = req.params.siteId;

  try {
    const doc = await db.collection("bots").doc(siteId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Bot no encontrado." });
    }

    res.json(doc.data()); // 🔹 Devuelve toda la config del bot
  } catch (error) {
    console.error("Error al obtener config del bot:", error);
    res.status(500).json({ error: "Error al obtener configuración del bot." });
  }
});

// Ruta API chat
router.post("/api/chat", async (req, res) => {
  const { message, siteId = "defaultBot" } = req.body;

  try {
    // 1. Traer config desde Firebase
    const doc = await db.collection("bots").doc(siteId).get();

    if (!doc.exists) {
      console.log("El documento no existe en Firestore:", siteId);
      return res.status(404).json({ reply: "Estamos experimentando algunos problemas. Intente más tarde." });
    }

    const botConfig = doc.data();

    // 🔹 1.1 Chequear si está activo
    if (botConfig?.config?.activo === 0 || botConfig?.config?.activo === false) {
      return res.json({
        reply: "⚠️ Este asistente está fuera de servicio temporalmente."
      });
    }

    // 2. Idioma dinámico (con fallback a "es")
    const languageCode = botConfig?.config?.idioma?.replace(/"/g, "") || "es";

    // 3. Crear sesión
    const sessionPathCustom = sessionClient.projectAgentSessionPath(
      process.env.DIALOGFLOW_PROJECT_ID,
      `${siteId}-${Date.now()}`
    );

    const request = {
      session: sessionPathCustom,
      queryInput: {
        text: { text: message, languageCode }
      },
      queryParams: {
        payload: jsonToStructProto({ siteId }) // 👈 siteId correcto
      }
    };

    // 4. Llamar a Dialogflow
    const responses = await sessionClient.detectIntent(request);

    if (!responses?.[0]?.queryResult) {
      console.error("Respuesta inesperada de Dialogflow:", responses);
      return res.status(500).json({ reply: "Error: respuesta vacía de Dialogflow." });
    }

    const result = responses[0].queryResult;
    console.log(result)

    // 5. Fallback a config si no hay fulfillment
    let reply =
      result.webhookPayload ||
      result.fulfillmentText ||
      result.fulfillmentMessages?.[0]?.text?.text?.[0]
      "No entendí eso.";
      
    res.send({ reply });

  } catch (error) {
    console.error("Error con DialogFlow:", error.message);
    res.status(500).json({ reply: "Error del bot al conectarse con DialogFlow." });
  }
});

// Ruta para enviar mensaje interno
router.post("/send-message", async (req, res) => {
    const { name, email, phone, message, siteId } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // o smtp propio
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Chatbot ${siteId}" <${process.env.MAIL_USER}>`,
            to: process.env.SITE_OWNER_EMAIL || "dueño@midominio.com",
            subject: `Nuevo mensaje desde el chatbot (${siteId})`,
            html: `
                <h3>Nuevo mensaje recibido:</h3>
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Teléfono:</strong> ${phone}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${message}</p>
            `
        });

        res.json({ ok: true, msg: "Mensaje enviado con éxito" });
    } catch (err) {
        console.error("Error enviando mensaje:", err);
        res.status(500).json({ ok: false, msg: "Error al enviar mensaje" });
    }
});

// Webhook
router.post("/webhook", express.json(), fulfillmentHandler);

module.exports = router;
