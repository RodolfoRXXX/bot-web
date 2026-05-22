const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const chatController = require("../controllers/chatController");
const configController = require("../controllers/configController");

const router = express.Router();

// Ruta widget
router.get("/widget", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/widget.html"));
});

// Ruta para obtener configuración del bot según siteId
router.get("/api/config/:siteId", configController.getBotConfig);

// Ruta API chat con Gemini
router.post("/api/chat", chatController.chat);

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
    return res.json({ ok: true, msg: "Mensaje enviado correctamente" });
  } catch (err) {
    console.error("❌ Error al enviar el mensaje:", err);
    return res.status(500).json({ ok: false, msg: "Error al enviar el mensaje" });
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
    return res.json({ ok: true, msg: "Mensaje enviado correctamente" });
  } catch (err) {
    console.error("❌ Error inesperado:", err);
    return res.status(500).json({ ok: false, msg: "Error al enviar el mensaje" });
  }
});

module.exports = router;
