import { getAboutModalContent, handleEscapeKey } from "./aboutModal.js";
import { injectModalStyles } from "./injectModalStyles.js";
import { loadVersionInfo } from "../../app/initialization/loadVersionInfo.js";

/**
 * Enhanced modal initialization with modern styling and smooth animations
 */
export function ensureAboutModal() {
    const existingModal = document.getElementById("about-modal");
    if (existingModal) {return;}

    const modal = document.createElement("div");
    modal.id = "about-modal";
    modal.className = "modal fancy-modal";
    modal.style.display = "none";
    modal.innerHTML = getAboutModalContent();
    document.body.appendChild(modal);

    // Add global event listeners
    document.addEventListener("keydown", handleEscapeKey, true);

    // Inject enhanced styles
    injectModalStyles();

    // Load version information dynamically
    loadVersionInfo();
}
