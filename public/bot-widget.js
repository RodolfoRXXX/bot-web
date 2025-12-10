
(function () {
    const currentScript = document.currentScript;
    const siteId = currentScript.getAttribute("data-siteid") || "defaultBot";

    // 🟦 Botón flotante
    const btn = document.createElement("div");
    btn.innerHTML = "🗨️"; // Cambiá el ícono aquí
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.width = "60px";
    btn.style.height = "60px";
    btn.style.background = "rgb(0, 123, 255)";
    btn.style.borderRadius = "50%";
    btn.style.display = "flex";
    btn.style.justifyContent = "center";
    btn.style.alignItems = "center";
    btn.style.color = "#fff";
    btn.style.fontSize = "30px";
    btn.style.cursor = "pointer";
    btn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    btn.style.zIndex = "9999";
    btn.title = "Abrir chat";
    document.body.appendChild(btn);

    // 🗨️ Globo lateral “¿Puedo ayudarte?”
    const bubbleHint = document.createElement("div");
    bubbleHint.textContent = "¿Puedo ayudarte?";
    bubbleHint.style.position = "fixed";
    bubbleHint.style.bottom = "35px";
    bubbleHint.style.right = "90px";
    bubbleHint.style.background = "#fff";
    bubbleHint.style.color = "#333";
    bubbleHint.style.padding = "8px 12px";
    bubbleHint.style.borderRadius = "20px";
    bubbleHint.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
    bubbleHint.style.fontSize = "14px";
    bubbleHint.style.fontFamily = "sans-serif";
    bubbleHint.style.zIndex = "9998";
    bubbleHint.style.opacity = "0";
    bubbleHint.style.pointerEvents = "none";
    bubbleHint.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    bubbleHint.style.transform = "translateX(20px)";
    document.body.appendChild(bubbleHint);

    // 🕓 Mostrar y ocultar el globito
    function showHint() {
        if (!chatAbierto && !usuarioInteraccion) {
            bubbleHint.style.opacity = "1";
            bubbleHint.style.transform = "translateX(0)";
            setTimeout(() => {
                bubbleHint.style.opacity = "0";
                bubbleHint.style.transform = "translateX(20px)";
            }, 6000);
        }
    }

    // Primera aparición
    setTimeout(showHint, 2000);

    // Repetir cada 20 segundos
    const hintInterval = setInterval(showHint, 20000);

    // 💬 Iframe del chat
    const iframe = document.createElement("iframe");

    // En desarrollo
    //iframe.src = `http://localhost:3000/widget?siteId=${encodeURIComponent(siteId)}`;

    // En producción
    iframe.src = `https://my-bot-web.onrender.com/widget?siteId=${encodeURIComponent(siteId)}`;

    iframe.style.position = "fixed";
    iframe.style.bottom = "90px";
    iframe.style.right = "20px";
    iframe.style.width = "400px";
    iframe.style.height = "600px";
    iframe.style.maxWidth = "100%";
    iframe.style.maxHeight = "100%";
    iframe.style.border = "none";
    iframe.style.borderRadius = "10px";
    iframe.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    iframe.style.display = "none";
    iframe.style.zIndex = "9998";
    document.body.appendChild(iframe);

    let chatAbierto = false;
    let usuarioInteraccion = false;
    let chatIniciado = false;

    // 🎛️ Click del botón principal
    btn.addEventListener("click", () => {
        chatAbierto = !chatAbierto;
        iframe.style.display = chatAbierto ? "block" : "none";

        if (chatAbierto) {
            // Ícono de cerrar
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" 
                    width="26" height="26" viewBox="0 0 24 24" 
                    fill="none" stroke="#6c757d" stroke-width="2" 
                    stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>`;
            btn.title = "Cerrar Chat";
            btn.style.background = "#f8f9fa";
            bubbleHint.style.opacity = "0";
            bubbleHint.style.transform = "translateX(20px)";

            if (!chatIniciado) {
                chatIniciado = true;
                iframe.contentWindow.postMessage({ action: "initChat", siteId }, "*");
            }
        } else {
            btn.innerHTML = "🗨️";
            btn.title = "Abrir chat";
            btn.style.background = "#3496ff";
        }
    });

    // 📩 Mensajes desde el iframe (cuando el usuario escribe)
    window.addEventListener("message", (event) => {
        if (event.data && event.data.action === "userMessage") {
            usuarioInteraccion = true;
            clearInterval(hintInterval); // Detiene los globos
            bubbleHint.style.display = "none";
        }
    });
})();
