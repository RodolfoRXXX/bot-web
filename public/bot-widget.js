

(function () {
    const iframe = document.createElement("iframe");
    iframe.src = "http://TU_DOMINIO/widget";
    iframe.style.width = "300px";
    iframe.style.height = "400px";
    iframe.style.position = "fixed";
    iframe.style.bottom = "20px";
    iframe.style.right = "20px";
    iframe.style.border = "1px solid #ccc";
    iframe.style.borderRadius = "8px";
    iframe.style.zIndex = "10000";
    document.body.appendChild(iframe);
})();