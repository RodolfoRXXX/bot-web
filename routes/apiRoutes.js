
const express = require("express");
const path = require("path");
const { sessionClient, sessionPath } = require("../utils/dialogFlowClient");
const { fulfillmentHandler } = require("../controllers/fulfillmentController");

const router = express.Router();

// Ruta widget
router.get("/widget", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/widget.html"));
});

// Ruta API chat
router.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const request = {
      session: sessionPath,
      queryInput: {
        text: { text: message, languageCode: "es" },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    let reply = result.fulfillmentText || result.fulfillmentMessages?.[0]?.text?.text?.[0];

    res.send({ reply: reply || "No entendí eso." });

  } catch (error) {
    console.error("Error con DialogFlow:", error.message);
    res.status(500).json({ reply: "Error del bot al conectarse con DialogFlow." });
  }
});

// Webhook
router.post("/webhook", express.json(), fulfillmentHandler);

module.exports = router;
