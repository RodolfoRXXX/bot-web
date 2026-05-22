const { sendMessageToGemini } = require("../utils/geminiClient");
const botConfigService = require("../services/botConfigService");
const featureGateService = require("../services/featureGateService");
const { ACTION_POLICY_MAP } = require("../policies/planPolicies");

function resolveActionPolicy(action) {
  if (!action) {
    return null;
  }

  return ACTION_POLICY_MAP[action] || null;
}

async function chat(req, res) {
  const {
    message,
    siteId = "bot123",
    sessionId,
    action,
    featureKey: incomingFeatureKey,
    permissionKey: incomingPermissionKey
  } = req.body;

  try {
    const botConfig = await botConfigService.getBotConfig(siteId);

    if (!botConfig) {
      console.log("El documento no existe en Firestore:", siteId);
      return res.status(404).json({ reply: "Estamos experimentando algunos problemas. Intente más tarde." });
    }

    if (!featureGateService.isBotActive(botConfig)) {
      return res.json({
        reply: "⚠️ Este asistente está fuera de servicio temporalmente."
      });
    }

    const actionPolicy = resolveActionPolicy(action);
    const featureKey = incomingFeatureKey || actionPolicy?.featureKey;
    const permissionKey = incomingPermissionKey || actionPolicy?.permissionKey;

    if (!featureGateService.isFeatureEnabled(botConfig, featureKey) || !featureGateService.can(botConfig, permissionKey)) {
      return res.status(403).json({
        error: "FEATURE_NOT_ENABLED",
        reply: "Esta funcionalidad no está habilitada para este bot."
      });
    }

    const systemPrompt = botConfig?.systemPrompt || "Eres un asistente útil para este sitio web.";
    const conversationId = sessionId || `${siteId}-${Date.now()}`;
    const reply = await sendMessageToGemini(conversationId, message, systemPrompt);

    return res.send({ reply, sessionId: conversationId });
  } catch (error) {
    console.error("Error con Gemini:", error.message);
    return res.status(500).json({ reply: "Error del bot al conectarse con Gemini." });
  }
}

module.exports = {
  chat
};
