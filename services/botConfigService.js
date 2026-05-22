const botRepository = require("../repositories/botRepository");

async function getBotConfig(siteId) {
  return botRepository.getBotBySiteId(siteId);
}

module.exports = {
  getBotConfig
};
