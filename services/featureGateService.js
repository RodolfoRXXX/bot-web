const { PLAN_POLICIES } = require("../policies/planPolicies");

function getPlanCode(botConfig) {
  return botConfig?.plan?.code || "starter";
}

function getPolicy(botConfig) {
  const planCode = getPlanCode(botConfig);
  return PLAN_POLICIES[planCode] || PLAN_POLICIES.starter;
}

function isBotActive(botConfig) {
  const isConfigInactive = botConfig?.config?.activo === 0 || botConfig?.config?.activo === false;
  const planStatus = botConfig?.plan?.status;
  const isPlanActive = !planStatus || planStatus === "active";

  return !isConfigInactive && isPlanActive;
}

function isFeatureEnabled(botConfig, featureKey) {
  if (!featureKey) {
    return true;
  }

  const policy = getPolicy(botConfig);
  const byPlan = Boolean(policy.features?.[featureKey]);
  const byBot = botConfig?.features?.[featureKey]?.enabled;

  if (typeof byBot === "boolean") {
    return byPlan && byBot;
  }

  return byPlan;
}

function can(botConfig, permissionKey) {
  if (!permissionKey) {
    return true;
  }

  const policy = getPolicy(botConfig);
  const byPlan = Boolean(policy.permissions?.[permissionKey]);
  const byBot = botConfig?.permissions?.[permissionKey];

  if (typeof byBot === "boolean") {
    return byPlan && byBot;
  }

  return byPlan;
}

module.exports = {
  isBotActive,
  isFeatureEnabled,
  can
};
