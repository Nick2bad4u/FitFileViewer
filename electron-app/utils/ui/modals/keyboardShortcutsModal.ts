// Enhanced Keyboard Shortcuts modal dialog utility with modern design and animations

import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { attachExternalLinkHandlers } from "../links/externalLinkHandlers.js";
import {
    getKeyboardShortcutsModalRuntime,
    KEYBOARD_SHORTCUTS_MODAL_SVG_NAMESPACE,
    type KeyboardShortcutsModalTimerHandle,
} from "./keyboardShortcutsModalRuntime.js";
import { createModalFocusTrap } from "./modalFocusTrap.js";

type ShortcutCategory = {
    category: string;
    items: ShortcutItem[];
};

type ShortcutItem = {
    action: string;
    description: string;
    keys: string;
};

const keyboardShortcutsModalRuntime = getKeyboardShortcutsModalRuntime();

let closeTimer: KeyboardShortcutsModalTimerHandle | null = null;
let focusTrapCleanup: (() => void) | undefined;
let lastFocusedElement: HTMLElement | null = null;
let showAnimationFrame: number | null = null;
const modalAnimationDuration = 300; // Animation duration in milliseconds
const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
    {
        category: "File Operations",
        items: [
            {
                action: "Open File",
                description: "Open a FIT file for analysis",
                keys: "Ctrl+O",
            },
            {
                action: "Save As",
                description: "Save current data to file",
                keys: "Ctrl+S",
            },
            {
                action: "Print",
                description: "Print current view",
                keys: "Ctrl+P",
            },
            {
                action: "Close Window",
                description: "Close the application window",
                keys: "Ctrl+W",
            },
        ],
    },
    {
        category: "View Controls",
        items: [
            {
                action: "Reload",
                description: "Refresh the current view",
                keys: "Ctrl+R",
            },
            {
                action: "Toggle Fullscreen",
                description: "Enter or exit fullscreen mode",
                keys: "F11",
            },
            {
                action: "Toggle DevTools",
                description: "Open developer tools for debugging",
                keys: "Ctrl+Shift+I",
            },
        ],
    },
    {
        category: "Application",
        items: [
            {
                action: "Export",
                description: "Export data (assign in menu)",
                keys: "No default",
            },
            {
                action: "Theme: Dark/Light",
                description: "Switch between dark and light themes",
                keys: "Settings > Theme",
            },
        ],
    },
];

/**
 * Closes the keyboard shortcuts modal with smooth animations
 */
export function closeKeyboardShortcutsModal(): void {
    const modal = document.querySelector<HTMLElement>(
        "#keyboard-shortcuts-modal"
    );
    if (!modal || modal.style.display === "none") {
        return;
    }

    // Start closing animation
    modal.classList.remove("show");
    if (showAnimationFrame !== null) {
        keyboardShortcutsModalRuntime.cancelAnimationFrame(showAnimationFrame);
        showAnimationFrame = null;
    }
    focusTrapCleanup?.();
    focusTrapCleanup = undefined;

    // Wait for animation to complete before hiding
    if (closeTimer) {
        keyboardShortcutsModalRuntime.clearTimeout(closeTimer);
    }
    closeTimer = keyboardShortcutsModalRuntime.setTimeout(() => {
        closeTimer = null;
        modal.style.display = "none";

        // Restore focus
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }

        // Restore body scrolling
        document.body.style.overflow = "";
    }, modalAnimationDuration);
}

/**
 * Enhanced modal initialization with modern styling and smooth animations
 */
function ensureKeyboardShortcutsModal(): void {
    const existingModal = document.querySelector("#keyboard-shortcuts-modal");
    if (existingModal) {
        console.log("Keyboard shortcuts modal already exists");
        return;
    }

    console.log("Creating new keyboard shortcuts modal...");
    const modal = document.createElement("div");
    modal.id = "keyboard-shortcuts-modal";
    modal.className = "modal fancy-modal";
    modal.setAttribute("aria-describedby", "keyboard-shortcuts-modal-subtitle");
    modal.setAttribute("aria-labelledby", "keyboard-shortcuts-modal-title");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("role", "dialog");
    modal.style.display = "none";
    modal.append(createKeyboardShortcutsModalContent());
    document.body.append(modal);
    console.log("Modal element created and appended to body");

    // Add global event listeners
    addEventListenerWithCleanup(
        document,
        "keydown",
        handleShortcutsEscapeKey,
        true
    ); // Inject enhanced styles
    injectKeyboardShortcutsModalStyles();
    console.log("Modal styles injected");

    // Setup event handlers
    setupKeyboardShortcutsModalHandlers(modal);
    console.log("Modal event handlers set up");
}

/**
 * Creates the enhanced keyboard shortcuts modal content with modern styling.
 *
 * @returns Content root for the modal.
 */
function createKeyboardShortcutsModalContent(): HTMLElement {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    const content = document.createElement("div");
    content.className = "modal-content";

    const header = document.createElement("div");
    header.className = "modal-header";

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "modal-icon";
    iconWrapper.append(createKeyboardIcon());

    const closeButton = document.createElement("button");
    closeButton.id = "shortcuts-modal-close";
    closeButton.className = "modal-close";
    closeButton.type = "button";
    closeButton.tabIndex = 0;
    closeButton.setAttribute("aria-label", "Close Keyboard Shortcuts dialog");
    closeButton.append(createCloseIcon());

    header.append(iconWrapper, closeButton);

    const body = document.createElement("div");
    body.className = "modal-body";

    const title = document.createElement("h1");
    title.id = "keyboard-shortcuts-modal-title";
    title.className = "modal-title";
    const titleText = document.createElement("span");
    titleText.className = "title-gradient";
    titleText.textContent = "Keyboard Shortcuts";
    title.append(titleText);

    const subtitle = document.createElement("p");
    subtitle.id = "keyboard-shortcuts-modal-subtitle";
    subtitle.className = "modal-subtitle";
    subtitle.textContent =
        "Boost your productivity with these keyboard shortcuts";

    const shortcutsContainer = document.createElement("div");
    shortcutsContainer.className = "shortcuts-container";
    for (const category of SHORTCUT_CATEGORIES) {
        shortcutsContainer.append(createShortcutCategory(category));
    }

    body.append(title, subtitle, shortcutsContainer);
    content.append(header, body);
    backdrop.append(content);

    return backdrop;
}

function createKeyboardIcon(): SVGSVGElement {
    const icon = createSvgIcon("keyboard-icon");

    const keyboardBody =
        keyboardShortcutsModalRuntime.createSvgElement("rect");
    keyboardBody.setAttribute("x", "2");
    keyboardBody.setAttribute("y", "4");
    keyboardBody.setAttribute("width", "20");
    keyboardBody.setAttribute("height", "16");
    keyboardBody.setAttribute("rx", "2");
    keyboardBody.setAttribute("stroke", "currentColor");
    keyboardBody.setAttribute("stroke-width", "2");

    const keys = keyboardShortcutsModalRuntime.createSvgElement("path");
    keys.setAttribute(
        "d",
        "M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"
    );
    keys.setAttribute("stroke", "currentColor");
    keys.setAttribute("stroke-width", "2");
    keys.setAttribute("stroke-linecap", "round");

    icon.append(keyboardBody, keys);

    return icon;
}

function createCloseIcon(): SVGSVGElement {
    const icon = createSvgIcon();
    const closePath = keyboardShortcutsModalRuntime.createSvgElement("path");
    closePath.setAttribute("d", "M18 6L6 18M6 6l12 12");
    closePath.setAttribute("stroke", "currentColor");
    closePath.setAttribute("stroke-width", "2");
    closePath.setAttribute("stroke-linecap", "round");
    closePath.setAttribute("stroke-linejoin", "round");
    icon.append(closePath);

    return icon;
}

function createSvgIcon(className = ""): SVGSVGElement {
    const icon = keyboardShortcutsModalRuntime.createSvgElement("svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("xmlns", KEYBOARD_SHORTCUTS_MODAL_SVG_NAMESPACE);
    if (className) {
        icon.classList.add(className);
    }
    return icon;
}

function createShortcutCategory(category: ShortcutCategory): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "shortcuts-category";

    const title = document.createElement("h3");
    title.className = "shortcuts-category-title";
    title.textContent = category.category;

    const list = document.createElement("div");
    list.className = "shortcuts-list";
    for (const item of category.items) {
        list.append(createShortcutItem(item));
    }

    wrapper.append(title, list);

    return wrapper;
}

function createShortcutItem(item: ShortcutItem): HTMLElement {
    const row = document.createElement("div");
    row.className = "shortcut-item";

    const info = document.createElement("div");
    info.className = "shortcut-info";

    const action = document.createElement("span");
    action.className = "shortcut-action";
    action.textContent = item.action;

    const description = document.createElement("span");
    description.className = "shortcut-description";
    description.textContent = item.description;

    const keys = document.createElement("kbd");
    keys.className = "shortcut-keys";
    keys.textContent = item.keys;

    info.append(action, description);
    row.append(info, keys);

    return row;
}

/**
 * Handles Escape key for closing the keyboard shortcuts modal
 *
 * @param event - Keyboard event.
 */
function handleShortcutsEscapeKey(event: Event): void {
    if (event instanceof KeyboardEvent && event.key === "Escape") {
        const modal = document.querySelector<HTMLElement>(
            "#keyboard-shortcuts-modal"
        );
        if (modal && modal.style.display !== "none") {
            event.preventDefault();
            event.stopPropagation();
            closeKeyboardShortcutsModal();
        }
    }
}

/**
 * Injects enhanced CSS styles for the keyboard shortcuts modal
 */
function injectKeyboardShortcutsModalStyles(): void {
    if (document.querySelector("#keyboard-shortcuts-modal-styles")) {
        return;
    }
    const style = document.createElement("style");
    style.id = "keyboard-shortcuts-modal-styles";
    style.textContent = `
		/* Keyboard Shortcuts Modal Base Styles */
		.fancy-modal#keyboard-shortcuts-modal {
			position: fixed !important;
			top: 0 !important;
			left: 0 !important;
			width: 100vw !important;
			height: 100vh !important;
			z-index: 10000 !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			backdrop-filter: var(--backdrop-blur) !important;
			background: var(--color-overlay-bg) !important;
			opacity: 0;
			visibility: hidden;
			transition: all ${modalAnimationDuration}ms var(--transition-smooth);
		}

		.fancy-modal#keyboard-shortcuts-modal.show {
			opacity: 1;
			visibility: visible;
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-backdrop {
			position: relative;
			max-width: 90vw;
			max-height: 90vh;
			overflow: hidden;
		}

		/* Modal Content Styles */
		.fancy-modal#keyboard-shortcuts-modal .modal-content {
			background: var(--color-glass);
			border-radius: 24px;
			box-shadow: var(--color-box-shadow);
			border: 1px solid var(--color-glass-border);
			backdrop-filter: var(--backdrop-blur);
			overflow: hidden;
			position: relative;
			width: 720px;
			max-width: 90vw;
			color: var(--color-fg);
			transform: scale(0.8) translateY(40px);
			transition: transform ${modalAnimationDuration}ms var(--transition-bounce);
		}

		.fancy-modal#keyboard-shortcuts-modal.show .modal-content {
			transform: scale(1) translateY(0);
		}

		/* Modal Header */
		.fancy-modal#keyboard-shortcuts-modal .modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 24px 32px 16px;
			position: relative;
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-icon {
			width: 48px;
			height: 48px;
			background: var(--color-glass);
			border-radius: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			backdrop-filter: var(--backdrop-blur);
			border: 1px solid var(--color-glass-border);
		}

		.fancy-modal#keyboard-shortcuts-modal .keyboard-icon {
			width: 24px;
			height: 24px;
			color: var(--color-accent);
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-close {
			position: relative;
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: 12px;
			width: 40px;
			height: 40px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: var(--transition-smooth);
			backdrop-filter: var(--backdrop-blur);
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-close svg {
			width: 18px;
			height: 18px;
			color: var(--color-fg);
			opacity: 0.8;
			transition: all 0.2s ease;
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-close:hover {
			background: var(--color-glass);
			border-color: var(--color-border-light);
			transform: scale(1.05);
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-close:hover svg {
			opacity: 1;
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-close:active {
			transform: scale(0.95);
		}

		/* Modal Body */
		.fancy-modal#keyboard-shortcuts-modal .modal-body {
			padding: 0 32px 32px;
			text-align: center;
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-title {
			font-size: 2.5rem;
			font-weight: 700;
			margin: 0 0 8px 0;
			line-height: 1.2;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 16px;
			flex-wrap: wrap;
		}

		.fancy-modal#keyboard-shortcuts-modal .title-gradient {
			background: var(--color-title);
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-size: 200% 200%;
			animation: gradientShift 3s ease-in-out infinite;
		}

		@keyframes gradientShift {
			0%, 100% { background-position: 0% 50%; }
			50% { background-position: 100% 50%; }
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-subtitle {
			font-size: 1.1rem;
			color: var(--color-fg);
			opacity: 0.8;
			margin: 0 0 32px 0;
			font-weight: 400;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcuts-container {
			display: flex;
			flex-direction: column;
			gap: 24px;
			max-height: 60vh;
			overflow-y: auto;
			padding: 4px;
			text-align: left;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcuts-category {
			background: var(--color-glass);
			backdrop-filter: var(--backdrop-blur);
			border: 1px solid var(--color-glass-border);
			border-radius: var(--border-radius);
			padding: 20px;
			transition: var(--transition-smooth);
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcuts-category:hover {
			border-color: var(--color-border-light);
			transform: translateY(-2px);
			box-shadow: var(--color-box-shadow-light);
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcuts-category-title {
			margin: 0 0 16px 0;
			font-size: 1.2rem;
			font-weight: 600;
			color: var(--color-accent);
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcuts-category-title::before {
			content: '';
			width: 3px;
			height: 20px;
			background: var(--color-accent);
			border-radius: 2px;
			opacity: 0.7;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcuts-list {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcut-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px 16px;
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: var(--border-radius-small);
			transition: var(--transition-smooth);
			min-height: 60px;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcut-item:hover {
			background: var(--color-glass);
			border-color: var(--color-border-light);
			transform: translateX(4px);
			filter: brightness(1.1);
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcut-info {
			display: flex;
			flex-direction: column;
			gap: 4px;
			flex: 1;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcut-action {
			font-weight: 600;
			font-size: 1rem;
			color: var(--color-fg);
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcut-description {
			font-size: 0.875rem;
			color: var(--color-fg);
			opacity: 0.7;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcut-keys {
			background: var(--color-glass);
			color: var(--color-fg);
			border: 1px solid var(--color-accent);
			border-radius: var(--border-radius-small);
			padding: 8px 12px;
			font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
			font-size: 0.875rem;
			font-weight: 600;
			white-space: nowrap;
			box-shadow: var(--color-box-shadow-light);
			min-width: 80px;
			text-align: center;
			backdrop-filter: var(--backdrop-blur);
		}

		/* Custom scrollbar for shortcuts container */
		.fancy-modal#keyboard-shortcuts-modal .shortcuts-container::-webkit-scrollbar {
			width: 8px;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcuts-container::-webkit-scrollbar-track {
			background: var(--color-bg-alt);
			border-radius: 4px;
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcuts-container::-webkit-scrollbar-thumb {
			background: var(--color-border);
			border-radius: 4px;
			border: 1px solid var(--color-bg-alt);
		}

		.fancy-modal#keyboard-shortcuts-modal .shortcuts-container::-webkit-scrollbar-thumb:hover {
			background: var(--color-accent);
		}

		/* Responsive design */
		@media (max-width: 768px) {
			.fancy-modal#keyboard-shortcuts-modal .modal-content {
				width: 95vw;
				max-height: 95vh;
			}

			.fancy-modal#keyboard-shortcuts-modal .shortcut-item {
				flex-direction: column;
				align-items: flex-start;
				gap: 8px;
				min-height: auto;
			}

			.fancy-modal#keyboard-shortcuts-modal .shortcut-keys {
				align-self: flex-end;
				min-width: auto;
			}

			.fancy-modal#keyboard-shortcuts-modal .shortcuts-container {
				max-height: 70vh;
			}

			.fancy-modal#keyboard-shortcuts-modal .modal-body {
				padding: 0 20px 20px;
			}

			.fancy-modal#keyboard-shortcuts-modal .modal-header {
				padding: 20px 20px 16px;
			}
		}
		/* Focus improvements */
		.fancy-modal#keyboard-shortcuts-modal .shortcut-item:focus-within {
			outline: 2px solid var(--color-accent);
			outline-offset: 2px;
		}

		.fancy-modal#keyboard-shortcuts-modal .modal-close:focus {
			border-color: var(--color-border-light);
			box-shadow: 0 0 0 3px var(--color-glass);
		}
	`;
    document.head.append(style);
}

/**
 * Sets up event handlers for the keyboard shortcuts modal
 */
function setupKeyboardShortcutsModalHandlers(modal: HTMLElement): void {
    // Close button handler
    const closeBtn = modal.querySelector("#shortcuts-modal-close");
    if (closeBtn) {
        addEventListenerWithCleanup(
            closeBtn,
            "click",
            closeKeyboardShortcutsModal
        );
    }

    // Click outside to close
    addEventListenerWithCleanup(modal, "click", (event) => {
        if (event.target === modal) {
            closeKeyboardShortcutsModal();
        }
    });

    // Handle links for external navigation
    attachExternalLinkHandlers({ root: modal });
}

/**
 * Shows the keyboard shortcuts modal with smooth animations
 */
export function showKeyboardShortcutsModal(): void {
    console.log("showKeyboardShortcutsModal function called");
    ensureKeyboardShortcutsModal();

    const modal = document.querySelector<HTMLElement>(
        "#keyboard-shortcuts-modal"
    );
    console.log("Modal element found:", modal);
    if (!modal) {
        console.error(
            "Modal element not found after ensureKeyboardShortcutsModal"
        );
        return;
    }
    if (closeTimer) {
        keyboardShortcutsModalRuntime.clearTimeout(closeTimer);
        closeTimer = null;
    }

    // Store the currently focused element
    lastFocusedElement =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
    // Show modal with animation
    modal.style.display = "flex";
    console.log("Modal display set to flex");

    const applyShowClass = () => {
        if (!modal.classList.contains("show")) {
            modal.classList.add("show");
            console.log("Added show class to modal");
        }
    };

    if (showAnimationFrame !== null) {
        keyboardShortcutsModalRuntime.cancelAnimationFrame(showAnimationFrame);
    }
    showAnimationFrame = keyboardShortcutsModalRuntime.requestAnimationFrame(
        () => {
            showAnimationFrame = null;
            applyShowClass();
            console.log("Ensured show class via animation frame");
        }
    );
    if (showAnimationFrame === null) {
        console.warn(
            "requestAnimationFrame not available; applying show class synchronously"
        );
    }

    applyShowClass();

    // Focus management
    const closeBtn = modal.querySelector<HTMLElement>("#shortcuts-modal-close");
    if (!closeBtn) {
        console.warn("Close button not found");
    }

    // Trap focus within modal
    focusTrapCleanup?.();
    focusTrapCleanup = createModalFocusTrap(modal, closeBtn);

    // Prevent body scrolling
    document.body.style.overflow = "hidden";
    console.log("Body scroll prevented");
}
