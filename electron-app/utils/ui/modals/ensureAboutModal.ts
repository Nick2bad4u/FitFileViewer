import { loadVersionInfo } from "../../app/initialization/loadVersionInfo.js";
import { createAboutModalContentElement } from "./aboutModal.js";
import { getAboutModalRuntime } from "./aboutModalRuntime.js";
import { injectModalStyles } from "./injectModalStyles.js";

const aboutModalRuntime = getAboutModalRuntime();

/**
 * Enhanced modal initialization with modern styling and smooth animations
 */
export function ensureAboutModal(): void {
    const aboutModalDocument = getRequiredAboutModalDocument();
    const existingModal = aboutModalDocument.querySelector("#about-modal");
    if (existingModal) {
        return;
    }

    const modal = aboutModalDocument.createElement("div");
    modal.id = "about-modal";
    modal.className = "modal fancy-modal";
    modal.setAttribute("aria-labelledby", "about-modal-title");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("role", "dialog");
    modal.style.display = "none";
    modal.append(createAboutModalContentElement());
    aboutModalDocument.body.append(modal);

    // Inject enhanced styles
    injectModalStyles();

    // Load version information dynamically
    void loadVersionInfo();
}

function getRequiredAboutModalDocument(): Document {
    const aboutModalDocument = aboutModalRuntime.getDocument();
    if (!aboutModalDocument) {
        throw new TypeError("ensureAboutModal requires a document runtime");
    }

    return aboutModalDocument;
}
