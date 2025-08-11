
const pedidos = require("../pedidos.json");

function ConsultarEstadoPedido(codigo_seguimiento) {
    // Si el parámetro viene como array, tomar el primero
    const codigo = Array.isArray(codigo_seguimiento) ? codigo_seguimiento[0] : codigo_seguimiento;

    // 1. Verificar que haya un código válido
    if (!codigo || typeof codigo !== "string" || codigo.trim() === "") {
        return {
            encontrado: false,
            mensaje: "No recibí un código de seguimiento válido."
        };
    }

    // 2. Buscar en la base de datos
    const pedido = pedidos.find(
        p => p.codigo.toLowerCase() === codigo.toLowerCase()
    );

    // 3. Responder según resultado
    if (pedido) {
        return {
            encontrado: true,
            mensaje: `El estado de tu pedido (${pedido.codigo}) es: ${pedido.estado}.`
        };
    } else {
        return {
            encontrado: false,
            mensaje: `No encontré ningún pedido con el código ${codigo}. Verifica que esté bien escrito.`
        };
    }
}

module.exports = { ConsultarEstadoPedido };
