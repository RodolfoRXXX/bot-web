const botConfigService = require("../services/botConfigService");

async function getBotConfig(req, res) {
  const siteId = req.params.siteId;

  try {
    const botConfig = await botConfigService.getBotConfig(siteId);

    if (!botConfig) {
      return res.status(404).json({ error: "Bot no encontrado." });
    }

    return res.json(botConfig);
  } catch (error) {
    console.error("Error al obtener config del bot:", error);
    return res.status(500).json({ error: "Error al obtener configuración del bot." });
  }
}

module.exports = {
  getBotConfig
};
