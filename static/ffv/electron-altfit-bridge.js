(function initializeElectronAltFitBridge() {
    "use strict";

    const FILE_INPUT_RETRY_DELAY_MS = 200;
    const FILE_INPUT_RETRY_LIMIT = 25;

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

    function handleFitFileBase64(base64) {
        const arrayBuffer = base64ToArrayBuffer(base64);
        scheduleFileInputLoad(arrayBuffer, () => showReceivedFallback(base64));
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

    function scheduleFileInputLoad(arrayBuffer, onFallback) {
        let attemptsRemaining = FILE_INPUT_RETRY_LIMIT;

        const trySimulateInput = () => {
            try {
                if (triggerFileInputFromArrayBuffer(arrayBuffer)) {
                    return;
                }
            } catch {
                onFallback();
                return;
            }

            attemptsRemaining -= 1;
            if (attemptsRemaining <= 0) {
                onFallback();
                return;
            }

            setTimeout(trySimulateInput, FILE_INPUT_RETRY_DELAY_MS);
        };

        trySimulateInput();
    }
})();
