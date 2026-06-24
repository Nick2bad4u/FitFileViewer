(function initializeElectronAltFitBridge() {
    "use strict";

    function base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let index = 0; index < binaryString.length; index += 1) {
            bytes[index] = binaryString.charCodeAt(index);
        }
        return bytes.buffer;
    }

    function showReceivedFallback(base64) {
        const root = document.getElementById("root");
        if (!root) {
            return;
        }

        const message = document.createElement("div");
        message.className = "electron-altfit-received-message";
        message.textContent = `Received FIT file from parent (base64, ${
            base64 ? base64.length : 0
        } bytes)`;
        root.replaceChildren(message);
    }

    function loadFitFileArrayBuffer(arrayBuffer) {
        if (typeof window.loadFitFileFromArrayBuffer === "function") {
            window.loadFitFileFromArrayBuffer(arrayBuffer);
            return true;
        }

        if (
            window.ffvApp &&
            typeof window.ffvApp.loadFitFileFromArrayBuffer === "function"
        ) {
            window.ffvApp.loadFitFileFromArrayBuffer(arrayBuffer);
            return true;
        }

        return false;
    }

    function handleFitFileBase64(base64) {
        const arrayBuffer = base64ToArrayBuffer(base64);
        if (loadFitFileArrayBuffer(arrayBuffer)) {
            return;
        }

        window.dispatchEvent(
            new CustomEvent("fitfile-received", {
                detail: arrayBuffer,
            })
        );
        showReceivedFallback(base64);
    }

    function isTrustedParentMessage(event) {
        if (event.source !== window.parent) {
            return false;
        }

        if (window.location.protocol === "file:") {
            return event.origin === "file://" || event.origin === "null";
        }

        return event.origin === window.location.origin;
    }

    window.addEventListener("message", (event) => {
        if (!isTrustedParentMessage(event)) {
            return;
        }

        if (!event.data || event.data.type !== "fit-file") {
            return;
        }

        const fitFileBase64 = event.data.base64;
        if (fitFileBase64) {
            handleFitFileBase64(fitFileBase64);
            return;
        }

        showReceivedFallback(fitFileBase64);
    });

    function triggerFileInputFromArrayBuffer(
        arrayBuffer,
        fileName = "electron-fit-file.fit"
    ) {
        const fileInput = document.querySelector('input[type="file"]');
        if (!fileInput) {
            return false;
        }

        const file = new File([arrayBuffer], fileName, {
            type: "application/octet-stream",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }

    window.addEventListener("fitfile-received", (event) => {
        if (loadFitFileArrayBuffer(event.detail)) {
            return;
        }

        const trySimulateInput = () => {
            if (!triggerFileInputFromArrayBuffer(event.detail)) {
                setTimeout(trySimulateInput, 200);
            }
        };
        trySimulateInput();
    });

    if (!window.electronAPI) {
        window.electronAPI = {};
    }

    if (typeof window.electronAPI.openFileDialog !== "function") {
        window.electronAPI.openFileDialog = async function openFileDialog() {
            alert(
                "Open File is only available in the main app. Use the main Open button to load files."
            );
            throw new Error(
                "openFileDialog is not available in this context. Use the main app to open files."
            );
        };
    }
})();
