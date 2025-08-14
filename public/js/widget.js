
const urlParams = new URLSearchParams(window.location.search);
const siteId = urlParams.get("siteId") || "defaultBot";
console.log("Widget cargado para: ", siteId);

// Obtener el tiempo
function getTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
// Agregar mensaje a enviar
function addMessage(sender, text, isTemporary = false) {
    const chat = document.getElementById("chat");
    const time = getTime();
    const id = "msg-" + Date.now();

    chat.innerHTML += `
        <div class="message ${sender}" id="${id}">
            <div class="profile-pic"></div>
            <div class="bubble">
                ${text}
                <div class="time">${time}</div>
            </div>
        </div>
    `;
    chat.scrollTop = chat.scrollHeight;
    return isTemporary ? id : null;
}
// Enviar mensaje
async function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();
    if (!message) return;

    addMessage("user", message);
    input.value = "";

    // Animación "Escribiendo..."
    const typingId = addMessage("bot", `
        <div class="typing-dots">
            <span></span><span></span><span></span>
        </div>
    `, true);

    // Obtener respuesta del bot (sin mostrar aún)
    const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message,
            siteId
         })
    });

    const data = await res.json();
    const reply = data.reply;

    // Calcular tiempo de espera: mínimo 1s, máximo 3.5s
    const words = reply.split(" ").length;
    let delay = Math.min(Math.max(words * 120, 1000), 3500);

    // Esperar antes de mostrar la respuesta
    await new Promise(resolve => setTimeout(resolve, delay));

    // Reemplazar burbuja
    const typingBubble = document.getElementById(typingId);
    if (typingBubble) {
        const bubble = typingBubble.querySelector(".bubble");
        const timeDiv = bubble.querySelector(".time");

        // Cambiar solo el texto del mensaje
        bubble.innerHTML = `
            ${reply}
            <div class="time">${getTime()}</div>
        `;
    }
}
// Evento para enviar mensaje con Enter
document.getElementById("userInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) { 
        e.preventDefault();
        sendMessage();
    }
});
// Limpiar el chat
document.getElementById("clear-chat-btn").addEventListener("click", function () {
    const chat = document.getElementById("chat");

    // Limpia el chat
    chat.innerHTML = "";

    // Agrega mensaje temporal
    const msg = document.createElement("div");
    msg.classList.add("system-message");
    msg.textContent = "💬 Chat reiniciado";
    chat.appendChild(msg);

    // Borra el mensaje después de 2 segundos
    setTimeout(() => {
        if (msg.parentNode) {
            msg.remove();
        }
    }, 2000);
});