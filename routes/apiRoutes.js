const express = require("express");
const path = require("path");
const db = require("../utils/firebase");
const { sendMessageToGemini } = require("../utils/geminiClient");
const nodemailer = require("nodemailer");

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

    res.json(doc.data());
  } catch (error) {
    console.error("Error al obtener config del bot:", error);
    res.status(500).json({ error: "Error al obtener configuración del bot." });
  }
});

// Ruta API chat con Gemini
router.post("/api/chat", async (req, res) => {
  const { message, siteId = "defaultBot", sessionId } = req.body;

  try {
    const doc = await db.collection("bots").doc(siteId).get();

    if (!doc.exists) {
      console.log("El documento no existe en Firestore:", siteId);
      return res.status(404).json({ reply: "Estamos experimentando algunos problemas. Intente más tarde." });
    }

    const botConfig = doc.data();

    if (botConfig?.config?.activo === 0 || botConfig?.config?.activo === false) {
      return res.json({
        reply: "⚠️ Este asistente está fuera de servicio temporalmente."
      });
    }

    const systemPrompt = botConfig?.systemPrompt || "Eres un asistente útil para este sitio web.";
    const conversationId = sessionId || `${siteId}-${Date.now()}`;
    const reply = await sendMessageToGemini(conversationId, message, systemPrompt);

    res.send({ reply, sessionId: conversationId });
  } catch (error) {
    console.error("Error con Gemini:", error.message);
    res.status(500).json({ reply: "Error del bot al conectarse con Gemini." });
  }
});

// Ruta para enviar mensaje interno(usando nodemailer para pruebas de desarrollo por fuera de Render) - Cambiar la ruta
router.post("/api/send-messages", async (req, res) => {
  const { name, phone, message, siteId, ownerEmail } = req.body;

  if (!ownerEmail) {
    return res.status(400).json({ ok: false, msg: "Falta el email del dueño del sitio" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Chatbot ${siteId}" <${process.env.MAIL_USER}>`,
      to: ownerEmail,
      subject: `💬 Nuevo mensaje desde el chatbot (${siteId})`,
      html: `
        <div style="font-family: sans-serif; background: #f9f9f9; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333;">Nuevo mensaje recibido desde el chatbot</h2>
          <p><strong>Nombre:</strong> ${name || "(no especificado)"}</p>
          <p><strong>Teléfono:</strong> ${phone || "(no especificado)"}</p>
          <p><strong>Mensaje:</strong></p>
          <blockquote style="background:#fff; padding:10px 15px; border-left:4px solid #009688;">
            ${message}
          </blockquote>
          <hr/>
          <p style="font-size:12px;color:#666;">Chatbot: <strong>${siteId}</strong></p>
        </div>
      `
    });

    console.log(`✅ Mensaje enviado al dueño del sitio (${ownerEmail})`);
    res.json({ ok: true, msg: "Mensaje enviado correctamente" });
  } catch (err) {
    console.error("❌ Error al enviar el mensaje:", err);
    res.status(500).json({ ok: false, msg: "Error al enviar el mensaje" });
  }
});

// Ruta para enviar mensaje interno (Resend)
router.post("/api/send-message", async (req, res) => {
  const { name, phone, message, siteId, ownerEmail } = req.body;

  if (!ownerEmail) {
    return res.status(400).json({ ok: false, msg: "Falta el email del dueño del sitio" });
  }

  try {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: `Chatbot ${siteId} <${process.env.MAIL_FROM}>`,
      to: ownerEmail,
      subject: `💬 Nuevo mensaje desde el chatbot (${siteId})`,
      html: `
        <div style="font-family: sans-serif; background: #f9f9f9; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333;">Nuevo mensaje recibido desde el chatbot</h2>
          <p><strong>Nombre:</strong> ${name || "(no especificado)"}</p>
          <p><strong>Teléfono:</strong> ${phone || "(no especificado)"}</p>
          <p><strong>Mensaje:</strong></p>
          <blockquote style="background:#fff; padding:10px 15px; border-left:4px solid #009688;">
            ${message}
          </blockquote>
          <hr/>
          <p style="font-size:12px;color:#666;">Chatbot: <strong>${siteId}</strong></p>
        </div>
      `
    });

    if (error) {
      console.error("❌ Error al enviar con Resend:", error);
      return res.status(500).json({ ok: false, msg: "Error al enviar el mensaje" });
    }

    console.log("✅ Email enviado:", data.id);
    res.json({ ok: true, msg: "Mensaje enviado correctamente" });
  } catch (err) {
    console.error("❌ Error inesperado:", err);
    res.status(500).json({ ok: false, msg: "Error al enviar el mensaje" });
  }
});

module.exports = router;
