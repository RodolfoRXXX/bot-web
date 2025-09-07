
const urlParams = new URLSearchParams(window.location.search);
const siteId = urlParams.get("siteId") || "defaultBot";

let inactivityTimer; // ⏱️ para controlar inactividad
let botActivo = true; // valor por defecto

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

// 
function structJsonToJs(fields) {
  const obj = {};
  for (const key in fields) {
    const value = fields[key];
    if (value.stringValue !== undefined) {
      obj[key] = value.stringValue;
    } else if (value.listValue !== undefined) {
      obj[key] = value.listValue.values.map(v => v.stringValue);
    } else if (value.structValue !== undefined) {
      obj[key] = structJsonToJs(value.structValue.fields);
    }
  }
  return obj;
}

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

// Volver al menú
function addBackToMenuButton(opciones) {
    const chat = document.getElementById("chat");

    // contenedor
    const backContainer = document.createElement("div");
    backContainer.classList.add("link-buttons");

    const backButton = document.createElement("button");
    backButton.classList.add("option-button");
    backButton.textContent = "🔙 Volver al menú de opciones";

    backButton.addEventListener("click", () => {
        // mostrar nuevamente las opciones
        showOptionButtons(opciones);

        // eliminar este botón de "volver" después de usarlo
        backContainer.remove();
    });

    backContainer.appendChild(backButton);
    chat.appendChild(backContainer);
    chat.scrollTop = chat.scrollHeight;
}

// Muestra botones de acción
function showOptionButtons(opciones) {
    const chat = document.getElementById("chat");

    // contenedor de botones
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("link-buttons");

    // recorrer opciones (salteamos "saludo")
    Object.entries(opciones).forEach(([label, intent]) => {
        if (label.toLowerCase() === "saludo") return;

        const button = document.createElement("button");
        button.classList.add("option-button");
        button.textContent = label;

        // Al hacer clic → enviar mensaje como si fuera usuario
        button.addEventListener("click", () => {
            addMessage("user", label);

            // eliminar botones
            buttonsContainer.remove();
            
            console.log(intent);

            // enviar el intent
            sendIntent(intent);
        });

        buttonsContainer.appendChild(button);
    });

    chat.appendChild(buttonsContainer);
    chat.scrollTop = chat.scrollHeight;
}

// Mapea las url en botones clickeables
function formatBotReply(reply) {
    const contentWrapper = document.createElement("div");
    contentWrapper.classList.add("bubble-and-buttons");

    // Caso 1: string plano
    if (typeof reply === "string") {
        appendBubbleWithLinks(contentWrapper, reply);
    }

    // Caso 2: objeto con texto y arrays
    else if (typeof reply === "object" && reply !== null) {
        // Texto (puede tener links dentro)
        if (reply.texto) {
            appendBubbleWithLinks(contentWrapper, reply.texto);
        }

        // Arrays → botones
        for (const key in reply) {
            const value = reply[key];
            if (Array.isArray(value)) {
                const buttonsContainer = document.createElement("div");
                buttonsContainer.classList.add("link-buttons");

                value.forEach(item => {
                    const link = document.createElement("a");
                    const button = document.createElement("button");

                    if (item.includes?.("@")) {
                        link.href = `mailto:${item}`;
                        button.textContent = `✉️ ${item}`;
                    }
                    else if (/^[\d\-\+\s]+$/.test(item)) {
                        link.href = `tel:${item}`;
                        button.textContent = `📞 ${item}`;
                    }
                    else if (item.startsWith("http")) {
                        const hostname = new URL(item).hostname.replace("www.", "");
                        const label = domainMap[hostname] || hostname;
                        link.href = item;
                        link.target = "_blank";
                        button.textContent = `🌐 ${label}`;
                    }
                    else {
                        link.href = "#";
                        button.textContent = item;
                    }

                    //link.classList.add("option-button");
                    link.appendChild(button);
                    buttonsContainer.appendChild(link);
                });

                contentWrapper.appendChild(buttonsContainer);
            }
        }
    }

    // 👇 SIEMPRE agregar el botón de volver
    setTimeout(() => {
        if (window.botConfig?.respuestas?.opciones) {
            addBackToMenuButton(...window.botConfig.respuestas.opciones);
        }
    }, 300);

    return contentWrapper;
}

// 🔹 Función auxiliar para no repetir código
function appendBubbleWithLinks(wrapper, text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);

    // Texto sin links
    let formattedText = text;
    if (urls && urls.length > 0) {
        formattedText = text.replace(urlRegex, "").trim();
    }

    // Burbuja con texto
    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.innerHTML = `
        ${formattedText}
        <div class="time">${getTime()}</div>
    `;
    wrapper.appendChild(bubble);

    // Si había links, generar botones
    if (urls && urls.length > 0) {
        const buttonsContainer = document.createElement("div");
        buttonsContainer.classList.add("link-buttons");

        urls.forEach(url => {
            const hostname = new URL(url).hostname.replace("www.", "");
            const label = domainMap[hostname] || hostname;

            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";

            const button = document.createElement("button");
            button.textContent = `▫️ ${label}`;

            link.appendChild(button);
            buttonsContainer.appendChild(link);
        });

        wrapper.appendChild(buttonsContainer);
    }
}

// Función que simula un intent
async function sendIntent(message) {
    resetInactivityTimer();

    // Animación "Escribiendo..."
    const typingId = addMessage("bot", `
        <div class="typing-dots">
            <span></span><span></span><span></span>
        </div>
    `, true);

    // Llamar al backend con el intent
    const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message,  // 👈 enviamos el intent en vez del mensaje de usuario
            siteId
        })
    });

    const data = await res.json();

    let reply;

    // Caso 1: texto plano (lo de siempre)
    if (data.reply.fields) {
       reply = structJsonToJs(data.reply.fields);
       // Simular demora
       await new Promise(resolve => setTimeout(resolve, 1000));
    }
    // Caso 2: payload estructurado (contacto)
    else {
        console.log(data);
        reply = data.reply;
        // Calcular tiempo de espera: mínimo 1s, máximo 3.5s
        const words = reply.split(" ").length;
        let delay = Math.min(Math.max(words * 120, 1000), 3500);

       // Esperar antes de mostrar la respuesta
       await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Reemplazar burbuja
    const typingBubble = document.getElementById(typingId);

    if (typingBubble) {
        const messageDiv = typingBubble;

        // limpiar solo la burbuja, no el contenedor completo
        messageDiv.querySelectorAll(".bubble, .bubble-and-buttons").forEach(el => el.remove());

        // volver a agregar el profilePic si no existe
        let profilePic = messageDiv.querySelector(".profile-pic");
        if (!profilePic) {
            profilePic = document.createElement("div");
            profilePic.classList.add("profile-pic");
            messageDiv.insertBefore(profilePic, messageDiv.firstChild);
        }

        // ahora insertar el nuevo contenido (texto + links formateados)
        messageDiv.appendChild(formatBotReply(reply));
    }
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

        window.botConfig = botConfig;

        botActivo = botConfig.config?.activo === 1; // 👈 chequear campo "activo"

        // Configurar título del chat
        document.getElementById("chat-title").textContent = botConfig.config?.nombre || "Asistente Virtual";
        document.getElementById("chat-subtitle").textContent = botConfig.config?.empresa  || "";

        // Configurar imagen del bot
        if (botConfig.config?.imagen) {
            document.getElementById("bot-avatar").src = sanitizeImageUrl(botConfig.config?.imagen);

        }

        // 👇 Perfíl dinámico
        const styleElement = document.createElement("style");
        styleElement.innerHTML = `
            .bot .profile-pic {
                background-image: url('${botConfig.config?.imagen || "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"}') !important;
            }

            /* 🎨 Colores dinámicos */
            #chatHeader {
                background-color: ${botConfig.config?.color?.encabezado || "#075e54"} !important;
                color: white !important;
            }

            body {
                background-color: ${botConfig.config?.color?.fondo || "#ffffff"} !important;
            }

            #chat-send {
                background-color: ${botConfig.config?.color?.boton || "#25d366"} !important;
                color: white !important;
                border: none !important;
                border-radius: 8px !important;
                padding: 6px 12px !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
            }

            .option-button {
                background-color: white !important;
                color: ${botConfig.config?.color?.encabezado || "#25d366"} !important;
                border: ${botConfig.config?.color?.encabezado || "#25d366"} !important;
                border-radius: 8px !important;
                padding: 6px 12px !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
            }

            #chat-send:hover, 
            .option-button:hover {
                transform: scale(1.05);
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

        // ✅ Bot activo → saludo inicial + segundo saludos + opciones
        addMessage("bot", botConfig.respuestas?.saludo || "Qué puedo hacer por vos?");

        // Mostrar botones con opciones
        if (botConfig.respuestas?.opciones) {
            showOptionButtons(...botConfig.respuestas?.opciones);
        }
    
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
    
    let reply;

    // Caso 1: texto plano (lo de siempre)
    if (data.reply.fields) {
       reply = structJsonToJs(data.reply.fields);
       // Simular demora
       await new Promise(resolve => setTimeout(resolve, 1000));
    }
    // Caso 2: payload estructurado (contacto)
    else {
        console.log(data);
        reply = data.reply;
        // Calcular tiempo de espera: mínimo 1s, máximo 3.5s
        const words = reply.split(" ").length;
        let delay = Math.min(Math.max(words * 120, 1000), 3500);

       // Esperar antes de mostrar la respuesta
       await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Reemplazar burbuja
    const typingBubble = document.getElementById(typingId);

    if (typingBubble) {
        const messageDiv = typingBubble;

        // limpiar solo la burbuja, no el contenedor completo
        messageDiv.querySelectorAll(".bubble, .bubble-and-buttons").forEach(el => el.remove());

        // volver a agregar el profilePic si no existe
        let profilePic = messageDiv.querySelector(".profile-pic");
        if (!profilePic) {
            profilePic = document.createElement("div");
            profilePic.classList.add("profile-pic");
            messageDiv.insertBefore(profilePic, messageDiv.firstChild);
        }

        // ahora insertar el nuevo contenido (texto + links formateados)
        messageDiv.appendChild(formatBotReply(reply));
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
    }, 10 * 60 * 1000); // ⏱️ 5 minutos
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
