
const restaurantes = require("../restaurantes.json");

function recomendarRestaurantes(tipoComida, zona) {
    const tipo = Array.isArray(tipoComida) ? tipoComida[0] : tipoComida;
    const lugar = Array.isArray(zona) ? zona[0] : zona;

    if (!tipo || !lugar) return null;

    const comida = tipo.toLowerCase();
    const area = lugar.toLowerCase();

    const lugares = restaurantes[comida]?.[area];

    if (lugares && lugares.length > 0) {
        return `Te recomiendo estos lugares de ${comida} en ${lugar}: ${lugares.join(", ")}.`;
    } else {
        return `No encontré restaurantes de ${comida} en ${lugar}. ¿Querés que busque en otra zona o con otro tipo de comida?`;
    }
}

module.exports = { recomendarRestaurantes };