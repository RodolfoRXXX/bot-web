
const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");
const path = require("path");

const CREDENTIALS = require(
  process.env.DIALOGFLOW_KEY_PATH || path.join(__dirname, "../config/dialogflow-key.json")
);

const sessionId = uuid.v4();
const projectId = CREDENTIALS.project_id;

const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    private_key: CREDENTIALS["private_key"],
    client_email: CREDENTIALS["client_email"],
  },
});

const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

module.exports = { sessionClient, sessionPath };
