

(function() {
    const btn = document.createElement("div");
    btn.innerHTML = "💬";
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
    document.body.appendChild(btn);

    const iframe = document.createElement("iframe");
    iframe.src = "http://localhost:3000/widget"; // URL donde corre tu bot
    iframe.style.position = "fixed";
    iframe.style.bottom = "90px";
    iframe.style.right = "20px";
    iframe.style.width = "350px";
    iframe.style.height = "500px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "10px";
    iframe.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    iframe.style.display = "none";
    iframe.style.zIndex = "9998";
    document.body.appendChild(iframe);

    btn.addEventListener("click", () => {
        iframe.style.display = (iframe.style.display === "none") ? "block" : "none";
    });
})();