/*
    Configuración de Firebase
*/

const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(
  process.env.FIREBASE_KEY_PATH || path.join(__dirname, "../config/firebase-key.json")
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// sirve para probar la conexión con Firestore
db.collection("bots").get()
  .then(snapshot => {
    console.log("Conexión correcta. Documentos en 'bots':", snapshot.size);
  })
  .catch(err => {
    console.error("Error conectando a Firestore:", err);
  });

module.exports = db;