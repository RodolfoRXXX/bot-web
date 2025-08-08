
const pedidos = require("../pedidos.json");

function buscarPedido(codigo_seguimiento) {
    const codigo = Array.isArray(codigo_seguimiento) ? codigo_seguimiento[0] : codigo_seguimiento;

    if (!codigo) return null;

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