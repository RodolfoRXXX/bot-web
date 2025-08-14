/*
    Configuración de Firebase
*/

const admin = require("firebase-admin");
const serviceAccount = require("../config/firebase-key.json");

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