// Utility for showing update notifications
export function showUpdateNotification(message, type = "info", duration = 6000, withAction = false) {
    const notification = document.getElementById("notification");
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";
    // Remove previous buttons if any
    while (notification.firstChild) notification.removeChild(notification.firstChild);
    const msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    notification.appendChild(msgSpan);
    if (withAction === "update-downloaded") {
        const restartBtn = document.createElement("button");
        restartBtn.textContent = "Restart & Update";
        restartBtn.className = "themed-btn";
        restartBtn.onclick = () => {
            if (window.electronAPI && window.electronAPI.installUpdate) {
                window.electronAPI.installUpdate();
            }
        };
        notification.appendChild(restartBtn);
        const laterBtn = document.createElement("button");
        laterBtn.textContent = "Later";
        laterBtn.className = "themed-btn";
        laterBtn.style.marginLeft = "10px";
        laterBtn.onclick = () => {
            notification.style.display = "none";
        };
        notification.appendChild(laterBtn);
    } else if (withAction) {
        const btn = document.createElement("button");
        btn.textContent = "Restart & Update";
        btn.className = "themed-btn";
        btn.onclick = () => {
            if (window.electronAPI && window.electronAPI.installUpdate) {
                window.electronAPI.installUpdate();
            }
        };
        notification.appendChild(btn);
    }
    if (!withAction || withAction === true) {
        setTimeout(function () {
            notification.style.display = "none";
        }, duration);
    }
}
