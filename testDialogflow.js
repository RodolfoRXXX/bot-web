// testDialogflow.js
const dialogflow = require('@google-cloud/dialogflow');
const credentials = require('./config/dialogflow-key.json'); // reemplaza con tu archivo local
const { jsonToStructProto } = require("./utils/jsonToStruct");

// Inicializar cliente con credenciales
const sessionClient = new dialogflow.SessionsClient({ credentials });

// Configuración de prueba
const projectId = credentials.project_id;
const siteId = 'bot123'; // <- cambia por tu siteId real
const sessionId = `${siteId}-${Date.now()}`; // igual que en tu backend
const languageCode = 'es';
const message = 'Hola, ¿cómo estás?';

async function testDetectIntent() {
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode,
      },
    },
    queryParams: {
      payload: jsonToStructProto({ siteId }) // 👈 siteId correcto
    }
  };

  console.log('📤 Enviando a Dialogflow:');
  console.log(JSON.stringify({ sessionId, siteId, message }, null, 2));

  try {
    const responses = await sessionClient.detectIntent(request);

    if (!responses?.[0]?.queryResult) {
      console.log('⚠️ Respuesta vacía de Dialogflow', responses);
      return;
    }

    const result = responses[0].queryResult;

    const reply =
      result.fulfillmentText ||
      result.fulfillmentMessages?.[0]?.text?.text?.[0] ||
      'No entendí eso.';

    console.log('✅ DetectIntent OK. Respuesta de Dialogflow:');
    console.log(reply);

  } catch (error) {
    console.error('❌ Error de permisos o configuración:', error);
  }
}

testDetectIntent();

