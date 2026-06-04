import { loadVersionInfo } from "../../app/initialization/loadVersionInfo.js";
import { createAboutModalContentElement } from "./aboutModal.js";
import { injectModalStyles } from "./injectModalStyles.js";

/**
 * Enhanced modal initialization with modern styling and smooth animations
 */
export function ensureAboutModal(): void {
    const existingModal = document.querySelector("#about-modal");
    if (existingModal) {
        return;
    }

    const modal = document.createElement("div");
    modal.id = "about-modal";
    modal.className = "modal fancy-modal";
    modal.setAttribute("aria-labelledby", "about-modal-title");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("role", "dialog");
    modal.style.display = "none";
    modal.append(createAboutModalContentElement());
    document.body.append(modal);

    // Inject enhanced styles
    injectModalStyles();

    // Load version information dynamically
    void loadVersionInfo();
}
