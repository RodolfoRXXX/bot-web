

// --- INTENCIÓNES 
    
    // SALUDO
    function saludo(agent, botConfig) {
        const msg = botConfig?.respuestas?.saludo || "¡Hola! Bienvenido a nuestro sitio.";
        agent.add(msg);
    }

    // DESPEDIDA
    function despedida(agent, botConfig) {
        const msg = botConfig?.respuestas?.despedida || "¡Gracias por tu visita!";
        agent.add(msg);
    }

    // HORARIO
    function horario(agent, botConfig) {
        const horario = botConfig?.respuestas?.horario || "Intente nuevamente";
        agent.add(`${horario}`);
    }

    // TELEFONO
    function telefono(agent, botConfig) {
        const telefono = botConfig?.respuestas?.telefono || "Intente nuevamente";
        agent.add(`${telefono}`);
    }

    // REDES
    function redes(agent, botConfig) {
        const redes = botConfig?.respuestas?.redes || "Intente nuevamente";
        agent.add(`${redes}`);
    }

module.exports = {
    saludo,
    despedida,
    horario,
    telefono,
    redes
};