
const urlParams = new URLSearchParams(window.location.search);
const siteId = urlParams.get("siteId") || "defaultBot";

let inactivityTimer; // ⏱️ para controlar inactividad
let botActivo = true; // valor por defecto

// Sanitizer
function sanitizeImageUrl(url) {
    try {
        const parsed = new URL(url);
        if (["http:", "https:"].includes(parsed.protocol)) {
            return parsed.href;
        }
    } catch (e) {}
    return "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"; // fallback
}

// Escuchar mensajes desde el iframe padre
window.addEventListener("message", (event) => {
    if (event.data.action === "initChat") {
        console.log("Init recibido para siteId:", event.data.siteId);
        initChat(event.data.siteId); // 👈 Llamamos a tu función
    }
});

// Ejemplo de initChat()
async function initChat(siteId) {
    try {
        const res = await fetch(`/api/config/${siteId}`);
        const botConfig = await res.json();

        botActivo = botConfig.config?.activo === 1; // 👈 chequear campo "activo"

        // Configurar título del chat
        document.getElementById("chat-title").textContent = botConfig.config?.nombre || "Asistente Virtual";

        // Configurar imagen del bot
        if (botConfig.config?.imagen) {
            document.getElementById("bot-avatar").src = sanitizeImageUrl(botConfig.config?.imagen);

        }

        // 👇 Sobrescribir la imagen de perfil dinámica
        const styleElement = document.createElement("style");
        styleElement.innerHTML = `
            .bot .profile-pic {
                background-image: url('${botConfig.config?.imagen || "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"}') !important;
            }
        `;
        document.head.appendChild(styleElement);

        const input = document.getElementById("userInput");

        if (!botActivo) {
            // 🚫 Bot desactivado
            addMessage("bot", botConfig.config?.mensajeInactivo || "⚠️ El asistente está fuera de servicio.");
            input.disabled = true;
            return;
        }

        // ✅ Bot activo → saludo inicial
        addMessage("bot", botConfig.respuestas?.saludoInicial || "👋 Hola! Soy tu asistente virtual.");
    
        // Activamos control de inactividad
        resetInactivityTimer();
    
    } catch (err) {
        console.error("Error cargando configuración:", err);
    }
}

// Obtener el tiempo
function getTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
// Agregar mensaje a enviar
function addMessage(sender, text, isTemporary = false) {
    const chat = document.getElementById("chat");
    const time = getTime();
    const id = "msg-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
    const profilePic = document.createElement("div");

    // Crear elementos
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.id = id;

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    // Contenido del texto
    if (sender === "user") {
        // Usuario: texto plano (seguro)
        bubble.textContent = text;
    } else {
        // Bot: permitir HTML (emoji, íconos, etc)
        bubble.innerHTML = text;
        profilePic.classList.add("profile-pic");
        messageDiv.appendChild(profilePic);
    }

    // Agregar hora
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("time");
    timeDiv.textContent = time;
    bubble.appendChild(timeDiv);

    // Armar mensaje
    messageDiv.appendChild(bubble);
    chat.appendChild(messageDiv);

    // Scrollear hasta abajo
    chat.scrollTop = chat.scrollHeight;

    return isTemporary ? id : null;
}
// Enviar mensaje
async function sendMessage() {
    if (!botActivo) return; // 🚫 no enviar si el bot está apagado

    const input = document.getElementById("userInput");
    const message = input.value.trim();
    if (!message) return;

    addMessage("user", message);
    input.value = "";

    resetInactivityTimer(); // 👈 reiniciar temporizador de inactividad

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

    // Reemplazar burbuja
    if (typingBubble) {
        const bubble = typingBubble.querySelector(".bubble");

        // Detectar links en la respuesta del bot
        let formattedReply = reply;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = reply.match(urlRegex);

        if (urls && urls.length > 0) {
            // Sacamos los links del texto
            formattedReply = reply.replace(urlRegex, "").trim();

            // Agregamos cada link como botón
            // Mapeo de dominios → nombres de redes
            const domainMap = {
                "facebook.com": "Facebook",
                "instagram.com": "Instagram",
                "twitter.com": "Twitter",
                "x.com": "X (Twitter)",
                "wa.me": "WhatsApp",
                "web.whatsapp.com": "WhatsApp",
                "t.me": "Telegram",
                "youtube.com": "YouTube",
                "linkedin.com": "LinkedIn",
                "pinterest.com": "Pinterest"
            };

            const buttons = urls.map(url => {
                const hostname = new URL(url).hostname.replace("www.", "");
                const label = domainMap[hostname] || hostname; // Si no está en el mapa, usa el dominio
                return `<a href="${url}" target="_blank">
                            <button style="margin:4px; padding:6px 12px; border:none; background:#007bff; color:white; border-radius:8px; cursor:pointer;">
                                🌐 ${label}
                            </button>
                        </a>`;
            }).join(" ");

            formattedReply += "<br><br>" + buttons;
        }

        // Cambiar solo el texto del mensaje
        bubble.innerHTML = `
            ${formattedReply}
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
    resetChat();
});

// 🔹 Funciones extra: inactividad + reset
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        addMessage("bot", "👋 Gracias por conversar conmigo. ¡Hasta pronto!");
        setTimeout(() => resetChat(), 3000); // espera 3s y reinicia
    }, 5 * 60 * 1000); // ⏱️ 5 minutos
}

function resetChat() {
    const chat = document.getElementById("chat");
    chat.innerHTML = "";
    const msg = document.createElement("div");
    msg.classList.add("system-message");
    msg.textContent = "💬 Chat reiniciado";
    chat.appendChild(msg);

    setTimeout(() => {
        if (msg.parentNode) msg.remove();
        if (typeof initChat === "function" && typeof siteId !== "undefined" && siteId) {
            initChat(siteId);
        }
    }, 2000);
}
