
(function () {
    const currentScript = document.currentScript;
    const siteId = currentScript.getAttribute("data-siteid") || "defaultBot";

    const btn = document.createElement("div");
    btn.innerHTML = "💬"; // Ícono inicial
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.width = "60px";
    btn.style.height = "60px";
    btn.style.background = "#007bff";
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

    // 👉 Animación CSS con rebote más suave
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            30% { transform: translateY(-12px); }
            60% { transform: translateY(-6px); }
        }
        .btn-bounce {
            animation: bounce 0.8s ease-in-out;
        }
    `;
    document.head.appendChild(style);

    const iframe = document.createElement("iframe");
    iframe.src = `https://my-bot-web.onrender.com/widget?siteId=${encodeURIComponent(siteId)}`;
    iframe.style.position = "fixed";
    iframe.style.bottom = "90px";
    iframe.style.right = "20px";
    iframe.style.width = "350px";
    iframe.style.height = "500px";
    iframe.style.maxWidth = "100%";
    iframe.style.maxHeight = "100%";
    iframe.style.border = "none";
    iframe.style.borderRadius = "10px";
    iframe.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    iframe.style.display = "none";
    iframe.style.zIndex = "9998";
    document.body.appendChild(iframe);

    let chatAbierto = false;
    let usuarioInteraccion = false; // 👈 ahora controlamos interacción real
    let bounceInterval;

    function startBouncing() {
        bounceInterval = setInterval(() => {
            if (!chatAbierto && !usuarioInteraccion) {
                let count = 0;
                const jump = setInterval(() => {
                    btn.classList.add("btn-bounce");
                    setTimeout(() => btn.classList.remove("btn-bounce"), 800);
                    count++;
                    if (count >= 3) clearInterval(jump);
                }, 1000);
            }
        }, 6000); // cada 6s repite la secuencia
    }

    startBouncing();

    let chatIniciado = false; // 👈 bandera global

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
                </svg>
            `;
            btn.title = "Cerrar Chat";
            btn.style.background = "#f8f9fa";

            // 👉 Solo mandar initChat una vez
            if (!chatIniciado) {
                chatIniciado = true;
                iframe.contentWindow.postMessage({ action: "initChat", siteId }, "*");
            }

        } else {
            // Ícono de abrir (💬)
            btn.innerHTML = "💬";
            btn.title = "Abrir chat";
            btn.style.background = "#3496ffff";
        }
    });


    // 👇 Escuchamos mensajes desde el iframe
    window.addEventListener("message", (event) => {
        if (event.data && event.data.action === "userMessage") {
            // Usuario escribió algo → detenemos rebotes definitivamente
            usuarioInteraccion = true;
            clearInterval(bounceInterval);
            btn.classList.remove("btn-bounce");
        }
    });
})();

