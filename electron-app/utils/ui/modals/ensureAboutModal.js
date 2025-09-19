import { loadVersionInfo } from "../../app/initialization/loadVersionInfo.js";
import { getAboutModalContent, handleEscapeKey } from "./aboutModal.js";
import { injectModalStyles } from "./injectModalStyles.js";

/**
 * Enhanced modal initialization with modern styling and smooth animations
 */
export function ensureAboutModal() {
    const existingModal = document.querySelector("#about-modal");
    if (existingModal) {
        return;
    }

    const modal = document.createElement("div");
    modal.id = "about-modal";
    modal.className = "modal fancy-modal";
    modal.style.display = "none";
    modal.innerHTML = getAboutModalContent();
    document.body.append(modal);

    // Add global event listeners
    document.addEventListener("keydown", handleEscapeKey, true);

    // Inject enhanced styles
    injectModalStyles();

    // Load version information dynamically
    loadVersionInfo();
}
