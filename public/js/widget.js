
const urlParams = new URLSearchParams(window.location.search);
const siteId = urlParams.get("siteId") || "defaultBot";

let inactivityTimer; // ⏱️ para controlar inactividad
let botActivo = true; // valor por defecto
let emailDueno = "bamboo.nothuman@gmail.com"

let contactFlowActive = false;
let contactData = { nombre: "", telefono: "", mensaje: "" };
let contactStep = 0;

let lastBotOptions = [];

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

// Mapeo de dominios → iconos
const domainIcons = {
    "facebook.com": "https://cdn-icons-png.flaticon.com/512/733/733547.png",
    "instagram.com": "https://cdn-icons-png.flaticon.com/512/2111/2111463.png",
    "twitter.com": "https://cdn-icons-png.flaticon.com/512/733/733579.png",
    "x.com": "https://cdn-icons-png.flaticon.com/512/5968/5968830.png",
    "wa.me": "https://cdn-icons-png.flaticon.com/512/733/733585.png",
    "web.whatsapp.com": "https://cdn-icons-png.flaticon.com/512/733/733585.png",
    "t.me": "https://cdn-icons-png.flaticon.com/512/2111/2111646.png",
    "youtube.com": "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",
    "linkedin.com": "https://cdn-icons-png.flaticon.com/512/3536/3536505.png",
    "pinterest.com": "https://cdn-icons-png.flaticon.com/512/145/145808.png"
};

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
    backButton.textContent = "🔙 Menú de opciones";

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

    // 🟢 Antes de mostrar los botones, traer saludo de la base (si existe)
    if (window.botConfig?.respuestas?.saludo) {
        addMessage("bot", window.botConfig.respuestas.saludo);
    } else {
        addMessage("bot", "¿Qué puedo hacer por vos?");
    }

    // 🧠 Guardar opciones actuales globalmente
    if (opciones && typeof opciones === "object") {
        window.lastBotOptions = opciones;
    }

    // contenedor de botones
    setTimeout(() => {
        const buttonsContainer = document.createElement("div");
        buttonsContainer.classList.add("link-buttons");

        Object.entries(opciones).forEach(([label, intent]) => {
            if (label.toLowerCase() === "saludo") return;

            const button = document.createElement("button");
            button.classList.add("option-button");
            button.textContent = label;

            button.addEventListener("click", () => {
                addMessage("user", label);
                buttonsContainer.remove();
                sendIntent(intent);
            });

            buttonsContainer.appendChild(button);
        });

        chat.appendChild(buttonsContainer);
        chat.scrollTop = chat.scrollHeight;
    }, 600); // medio segundo de espera para mostrar menú
}

// Mapea las url en botones clickeables
function formatBotReply(reply) {
    const contentWrapper = document.createElement("div");
    contentWrapper.classList.add("bubble-and-buttons");

    reply = deepExtractFields(reply);

    // 🔹 Caso 3: Respuesta simple (string plano)
    if (typeof reply === "string") {
        appendBubbleWithLinks(contentWrapper, reply);
    }

    // 🔹 Caso 1: Texto + arrays (estructura tipo medios/redes/texto)
    else if (typeof reply === "object" && reply !== null) {
        // Detectamos si hay un "texto"
        if (reply.texto?.stringValue) {
            appendBubbleWithLinks(contentWrapper, reply.texto.stringValue);
        }

        // Detectamos si hay arrays como "medios" o "redes"
        for (const key in reply) {
            const value = reply[key];

            if (value?.kind === "listValue" && value.listValue?.values) {
                const buttonsContainer = document.createElement("div");
                buttonsContainer.classList.add("link-buttons");

                value.listValue.values.forEach(item => {
                    if (!item.stringValue) return;

                    const str = item.stringValue;
                    const link = document.createElement("a");
                    const button = document.createElement("button");
                    button.classList.add("option-button");

                    // 📧 Emails
                    if (str.includes?.("@")) {
                        link.href = `mailto:${str}`;
                        button.textContent = `✉️ ${str}`;
                    }
                    // 📞 Teléfonos
                    else if (/^[\d\-\+\s]+$/.test(str)) {
                        link.href = `tel:${str}`;
                        button.textContent = `📞 ${str}`;
                    }
                    // 🔗 Links
                    else if (str.startsWith("http") || str.includes("|")) {
                        let url = str;
                        let label;
                        let hostname;
                        let iconUrl;

                        // 👉 Caso personalizado: "Título|acción o URL"
                        if (str.includes("|")) {
                            const parts = str.split("|");
                            label = parts[0].trim();
                            url = parts[1].trim();
                        } else {
                            // Extraer hostname real sin www
                            hostname = new URL(url).hostname.replace("www.", "");
                            label = domainMap[hostname] || hostname;
                        }

                        // Buscar ícono según dominio
                        if (hostname) {
                            iconUrl = Object.keys(domainIcons).find(key => hostname.endsWith(key))
                            ? domainIcons[Object.keys(domainIcons).find(key => hostname.endsWith(key))]
                            : null;   
                        }

                        // ⚙️ Acción especial: "contact"
                        if (url.toLowerCase() === "message") {
                            // No abrimos un link, llamamos al flujo del mensaje
                            const btn = document.createElement("button");
                            btn.textContent = `📨 ${label}`;
                            btn.classList.add("option-button");
                            btn.onclick = () => startContactFlow();
                            buttonsContainer.appendChild(btn);
                            return; // salir del forEach
                        }

                        // En cualquier otro caso: link normal
                        link.href = url;
                        link.target = "_blank";

                        // Si existe icono → usar <img>, sino → usar 🔗
                        if (iconUrl) {
                            button.innerHTML = `<img src="${iconUrl}" style="width:20px; height:20px; margin-right:6px;"> ${label}`;
                        } else {
                            button.innerHTML = `🔗 ${label}`;
                        }
                    }

                    // Texto plano
                    else {
                        link.href = "#";
                        button.textContent = str;
                    }

                    link.appendChild(button);
                    buttonsContainer.appendChild(link);
                });
                contentWrapper.appendChild(buttonsContainer);
            }
        }

        // 🔹 Caso 2: Pregunta/Respuesta (FAQ)
        const keys = Object.keys(reply);
        if (keys.length > 0 && keys.every(k => reply[k]?.kind === "stringValue")) {
            keys.forEach(key => {
                const pregunta = key;
                const respuesta = reply[key].stringValue;

                // contenedor de cada FAQ
                const faqItem = document.createElement("div");
                faqItem.classList.add("faq-item");

                // pregunta con botón
                const questionDiv = document.createElement("div");
                questionDiv.classList.add("faq-question");
                questionDiv.innerHTML = `
                    <span><strong>${pregunta}</strong></span>
                    <button class="faq-toggle">▼</button>
                `;

                // respuesta (oculta por defecto)
                const answerDiv = document.createElement("div");
                answerDiv.classList.add("faq-answer");
                answerDiv.innerHTML = `
                    <p>${respuesta}</p>
                `;

                // toggle click
                questionDiv.addEventListener("click", () => {
                    answerDiv.classList.toggle("open");
                    const btn = questionDiv.querySelector(".faq-toggle");
                    btn.classList.toggle("rotate");
                });

                faqItem.appendChild(questionDiv);
                faqItem.appendChild(answerDiv);
                contentWrapper.appendChild(faqItem);
            });
        }
    }

    // 👇 SIEMPRE agregar el botón de volver
    setTimeout(() => {
        if (window.botConfig?.respuestas?.opciones) {
            addBackToMenuButton(...window.botConfig.respuestas.opciones);
        }
    }, 800);

    return contentWrapper;
}

// 🔹 Función auxiliar para no repetir código
function appendBubbleWithLinks(wrapper, text) {
    // Regex captura cualquier URL, incluso dentro de "Título|URL"
    const urlRegex = /(?:\S+\|\s*)?(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);

    // Texto sin links
    let formattedText = text.replace(/(\S+\|\s*)?(https?:\/\/[^\s]+)/g, "").trim();

    // Burbuja con texto (si queda algo)
    if (formattedText) {
        const bubble = document.createElement("div");
        bubble.classList.add("bubble");
        bubble.innerHTML = `
            ${formattedText}
            <div class="time">${getTime()}</div>
        `;
        wrapper.appendChild(bubble);
    }

    // Si había links, generar botones
    if (urls && urls.length > 0) {
        const buttonsContainer = document.createElement("div");
        buttonsContainer.classList.add("link-buttons");

        urls.forEach(item => {
            let label, url;

            // 👉 Caso personalizado "Título|URL"
            if (item.includes("|")) {
                const parts = item.split("|");
                // 👉 Remueve [ ] si están presentes
                label = parts[0].replace(/^\[|\]$/g, "").trim();
                url = parts[1].trim();
            } else {
                url = item.trim();
                const hostname = new URL(url).hostname.replace("www.", "");
                label = domainMap[hostname] || hostname;
            }

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
    removeAllOptionButtons(); // 👈 limpia los botones de opciones previos

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

    // Caso 1: respuesta estructurada de Gemini
    if (data.reply.fields) {
        reply = data.reply.fields;
        // Simular demora
        await new Promise(resolve => setTimeout(resolve, 1000));
    } 
    // Caso 2: texto plano
    else {
        reply = data.reply;
        const words = reply.split(" ").length;
        let delay = Math.min(Math.max(words * 120, 1000), 3500);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Reemplazar burbuja "escribiendo..." con la respuesta
    const typingBubble = document.getElementById(typingId);
    if (typingBubble) {
        typingBubble.querySelectorAll(".bubble, .bubble-and-buttons").forEach(el => el.remove());

        let profilePic = typingBubble.querySelector(".profile-pic");
        if (!profilePic) {
            profilePic = document.createElement("div");
            profilePic.classList.add("profile-pic");
            typingBubble.insertBefore(profilePic, typingBubble.firstChild);
        }

        typingBubble.appendChild(formatBotReply(reply));
    }
}

// Escuchar mensajes desde el iframe padre
window.addEventListener("message", (event) => {
    if (event.data.action === "initChat") {
        initChat(event.data.siteId); // 👈 Llamamos a tu función
    }
});

// Ejemplo de initChat()
async function initChat(siteId) {
    try {
        const res = await fetch(`/api/config/${siteId}`);
        const botConfig = await res.json();

        window.botConfig = botConfig;

        // 🧠 Guardar opciones iniciales globalmente
        if (botConfig?.respuestas?.opciones) {
            window.lastBotOptions = botConfig.respuestas.opciones;
        }

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
                background-color: ${botConfig.config?.color?.encabezado || "#aeaeae"} !important;
                color: white !important;
            }

            body {
                background-color: ${botConfig.config?.color?.fondo || "#ece5dd"} !important;
            }

            #chat-send {
                background-color: ${botConfig.config?.color?.boton || "#aeaeae"} !important;
                color: white !important;
                border: none !important;
                border-radius: 8px !important;
                padding: 6px 12px !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
            }

            #chat-send:hover {
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

        // Mostrar botones con opciones
        setTimeout(() => {
            if (botConfig.respuestas?.opciones) {
                showOptionButtons(...botConfig.respuestas?.opciones);
            }
        }, 600);
    
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
        bubble.classList.add("user-bubble");
    } else {
        // Bot: permitir HTML (emoji, íconos, etc)
        bubble.innerHTML = text;
        bubble.classList.add("bot-bubble");
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

    // animación typing simulada
    if (sender === "bot") {
        bubble.style.animationName = "slideUp"; // global
    }

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

    removeAllOptionButtons(); // 👈 limpia los botones anteriores

    addMessage("user", message);
    input.value = "";

    resetInactivityTimer(); // 👈 reiniciar temporizador de inactividad

    // 🟡 Si está activo el flujo de contacto, no enviamos a Gemini
    if (contactFlowActive) {
        handleContactFlow(message);
        return; // 🚫 salimos antes de llamar al backend
    }

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
    if (data.reply?.fields || data.reply?.reply?.fields) {
        reply = data.reply;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    // Caso 2: payload estructurado (contacto)
    else {
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

// -- Mensajes directos
// 📨 --- Contact Flow mejorado ---

function startContactFlow() {
    contactFlowActive = true;
    contactData = { nombre: "", telefono: "", mensaje: "" };
    contactStep = 0;

    removeAllOptionButtons();

    addMessage("bot", "📩 Perfecto, vamos a enviar un mensaje al sitio. ¿Cuál es tu nombre?");
    showCancelContactButton();
}

// 🔹 Mostrar botones de cancelar / enviar (dependiendo del paso)
function showCancelContactButton() {
    removeAllOptionButtons();

    const chat = document.getElementById("chat");
    const buttons = document.createElement("div");
    buttons.classList.add("contact-buttons");

    const cancelBtn = document.createElement("button");
    cancelBtn.classList.add("cancel-button");
    cancelBtn.textContent = "❌ Cancelar mensaje";
    cancelBtn.onclick = cancelContactFlow;

    buttons.appendChild(cancelBtn);
    chat.appendChild(buttons);
    chat.scrollTop = chat.scrollHeight;
}

// 🔹 Eliminar una burbuja específica
function removeMessageBubble(messageId) {
    const msg = document.getElementById(messageId);
    if (msg) msg.remove();
}

// 🔹 Limpiar flujo completo
function resetContactFlow() {
    contactFlowActive = false;
    contactData = { nombre: "", telefono: "", mensaje: "" };
    contactStep = 0;
    document.querySelectorAll(".contact-buttons").forEach(el => el.remove());
}

// 🔹 Manejar los pasos del flujo (nombre → teléfono → mensaje)
function handleContactFlow(message) {
    const input = document.getElementById("userInput");

    switch (contactStep) {
        case 0:
            contactData.nombre = message;
            addMessage("bot", `Gracias, ${contactData.nombre} 😊. ¿Podrías dejarme tu teléfono de contacto?`);
            contactStep = 1;
            showCancelContactButton();
            break;

        case 1:
            contactData.telefono = message;
            addMessage("bot", "Perfecto. Ahora escribí el mensaje que querés enviar 📝");
            contactStep = 2;
            showCancelContactButton();
            break;

        case 2:
            contactData.mensaje = message;
            removeAllOptionButtons();

            addMessage("bot", "📨 Confirmá si querés enviar el siguiente mensaje:");
            addMessage("bot", `
                <div class="confirm-box">
                    <p><strong>Nombre:</strong> ${contactData.nombre}</p>
                    <p><strong>Teléfono:</strong> ${contactData.telefono}</p>
                    <p><strong>Mensaje:</strong> ${contactData.mensaje}</p>
                </div>
            `);

            const chat = document.getElementById("chat");
            const confirmBtns = document.createElement("div");
            confirmBtns.classList.add("contact-buttons");

            const sendBtn = document.createElement("button");
            sendBtn.classList.add("send-button");
            sendBtn.textContent = "✅ Enviar";
            sendBtn.onclick = async () => {
                confirmBtns.remove();

                const sendingId = addMessage("bot", "📤 Enviando mensaje...", true);

                try {
                    const res = await fetch("/api/send-message", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: contactData.nombre,
                            phone: contactData.telefono,
                            message: contactData.mensaje,
                            siteId,
                            ownerEmail: window.botConfig?.config?.email || emailDueno
                        })
                    });

                    const data = await res.json();
                    removeMessageBubble(sendingId); // 💥 ahora sí se borra

                    if (data.ok) {
                        addMessage("bot", "✅ Tu mensaje fue enviado con éxito. ¡Gracias por contactarnos!");
                    } else {
                        addMessage("bot", "❌ Ocurrió un error al enviar el mensaje. Por favor, intentá más tarde.");
                    }
                } catch (err) {
                    console.error("Error:", err);
                    removeMessageBubble(sendingId);
                    addMessage("bot", "⚠️ No se pudo enviar el mensaje. Revisá tu conexión.");
                }

                // 🔹 Limpieza total del flujo
                resetContactFlow();

                // Mostrar opciones de nuevo
                setTimeout(() => {
                    showOptionButtons(...window.botConfig?.respuestas?.opciones || window.lastBotOptions);
                }, 1200);
            };

            const cancelBtn = document.createElement("button");
            cancelBtn.classList.add("cancel-button");
            cancelBtn.textContent = "❌ Cancelar";
            cancelBtn.onclick = cancelContactFlow;

            confirmBtns.appendChild(sendBtn);
            confirmBtns.appendChild(cancelBtn);
            chat.appendChild(confirmBtns);
            chat.scrollTop = chat.scrollHeight;
            break;
    }

    input.value = "";
}

// 🔹 Cancelar flujo de contacto
function cancelContactFlow() {
    resetContactFlow();
    addMessage("bot", "❌ Se canceló el envío del mensaje.");

    setTimeout(() => {
        showOptionButtons(...window.botConfig?.respuestas?.opciones || window.lastBotOptions);
    }, 800);
}

// 🔹 Interceptar mensajes del usuario cuando está activo el flujo de contacto
const oldSendMessage = sendMessage;
sendMessage = async function() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();
    if (!message) return;

    if (contactFlowActive) {
        addMessage("user", message);
        handleContactFlow(message);
        return; // 👈 Evitamos enviarlo al backend
    }

    await oldSendMessage(); // 👈 Flujo normal si no está en contacto
};

async function sendContactMessage() {
    try {
        const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contactData),
        });

        if (res.ok) {
            addMessage("bot", "✅ ¡Mensaje enviado correctamente! Gracias por contactarnos.");
        } else {
            addMessage("bot", "⚠️ Hubo un problema al enviar el mensaje. Intentalo más tarde.");
        }
    } catch (err) {
        console.error(err);
        addMessage("bot", "❌ Error al enviar el mensaje. Revisá tu conexión.");
    }

    // Salimos del flujo
    contactFlowActive = false;
}

// ----------------------------------

function removeTypingBubble(id) {
    const typing = document.getElementById(id);
    if (typing) typing.remove();
}

function deepExtractFields(obj) {
    if (!obj || typeof obj !== "object") return obj;

    // 🔹 1️⃣ Desempaquetar niveles innecesarios (loop hasta llegar al nivel útil)
    let lastObj = null;
    let safety = 0;
    while (safety < 10) { // evita loop infinito
        safety++;

        if (
            obj?.fields?.null?.structValue?.fields?.reply?.structValue?.fields?.fields?.structValue?.fields
        ) {
            obj = obj.fields.null.structValue.fields.reply.structValue.fields.fields.structValue.fields;
        } else if (obj?.fields?.reply?.structValue?.fields?.fields?.structValue?.fields) {
            obj = obj.fields.reply.structValue.fields.fields.structValue.fields;
        } else if (obj?.reply?.fields?.reply?.structValue?.fields) {
            obj = obj.reply.fields.reply.structValue.fields;
        } else if (obj?.reply?.fields) {
            obj = obj.reply.fields;
        } else if (obj?.fields?.reply?.structValue?.fields) {
            obj = obj.fields.reply.structValue.fields;
        } else if (obj?.fields) {
            obj = obj.fields;
        } else {
            break;
        }

        // si no cambia más, cortamos
        if (obj === lastObj) break;
        lastObj = obj;
    }

    // 🔹 2️⃣ Si hay structValue.fields dentro de los valores, aplanar
    for (const key in obj) {
        const val = obj[key];
        if (val?.structValue?.fields) {
            obj[key] = val.structValue.fields;
        }
    }

    // 🔹 3️⃣ Simplificar stringValue anidados y listas complejas
    for (const key in obj) {
        const val = obj[key];

        // texto.stringValue.stringValue → texto.stringValue
        if (val?.stringValue?.stringValue) {
            obj[key].stringValue = val.stringValue.stringValue;
        }

        // medios.listValue.structValue.fields.values.listValue.values → medios.listValue.values
        else if (val?.listValue?.structValue?.fields?.values?.listValue?.values) {
            obj[key].listValue = val.listValue.structValue.fields.values.listValue;
        }

        // Simplificar arrays de valores
        if (val?.listValue?.values) {
            obj[key].listValue.values = val.listValue.values.map(v => {
                if (v?.structValue?.fields?.stringValue?.stringValue) {
                    return { stringValue: v.structValue.fields.stringValue.stringValue };
                } else if (v?.stringValue) {
                    return { stringValue: v.stringValue };
                }
                return v;
            });
        }
    }

    // 🔹 4️⃣ Normalizar: agregar kind al final de cada bloque
    const normalized = {};
    for (const key in obj) {
        const val = obj[key];
        if (val?.stringValue) {
            normalized[key] = { stringValue: val.stringValue, kind: "stringValue" };
        } else if (val?.listValue?.values) {
            normalized[key] = { listValue: val.listValue, kind: "listValue" };
        } else {
            normalized[key] = val;
        }
    }

    return normalized;
}

function removeAllOptionButtons() {
    document.querySelectorAll(".link-buttons").forEach(el => el.remove());
}