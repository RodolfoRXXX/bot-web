const db = require("../utils/firebase");

async function getBotBySiteId(siteId) {
  const doc = await db.collection("bots").doc(siteId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
}

module.exports = {
  getBotBySiteId
};
