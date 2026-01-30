// Enhanced Keyboard Shortcuts modal dialog utility with modern design and animations

import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { attachExternalLinkHandlers } from "../links/externalLinkHandlers.js";

/** @type {any} */
let lastFocusedElement = null;
const modalAnimationDuration = 300; // Animation duration in milliseconds

/**
 * Closes the keyboard shortcuts modal with smooth animations
 */
function closeKeyboardShortcutsModal() {
    const modal = document.querySelector("#keyboard-shortcuts-modal");
    if (!modal || modal.style.display === "none") {
        return;
    }

    // Start closing animation
    modal.classList.remove("show");

    // Wait for animation to complete before hiding
    setTimeout(() => {
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
function ensureKeyboardShortcutsModal() {
    const existingModal = document.querySelector("#keyboard-shortcuts-modal");
    if (existingModal) {
        console.log("Keyboard shortcuts modal already exists");
        return;
    }

    console.log("Creating new keyboard shortcuts modal...");
    const modal = document.createElement("div");
    modal.id = "keyboard-shortcuts-modal";
    modal.className = "modal fancy-modal";
    modal.style.display = "none";
    modal.innerHTML = getKeyboardShortcutsModalContent();
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
 * Creates the enhanced keyboard shortcuts modal content with modern styling
 *
 * @returns {string} HTML content for the modal
 */
function getKeyboardShortcutsModalContent() {
    const shortcuts = [
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

    let shortcutsHtml = "";
    for (const category of shortcuts) {
        shortcutsHtml += `
			<div class="shortcuts-category">
				<h3 class="shortcuts-category-title">${category.category}</h3>
				<div class="shortcuts-list">
					${category.items
                        .map(
                            (item) => `
						<div class="shortcut-item">
							<div class="shortcut-info">
								<span class="shortcut-action">${item.action}</span>
								<span class="shortcut-description">${item.description}</span>
							</div>
							<kbd class="shortcut-keys">${item.keys}</kbd>
						</div>
					`
                        )
                        .join("")}
				</div>
			</div>
		`;
    }
    return `
		<div class="modal-backdrop">
			<div class="modal-content">
				<div class="modal-header">
					<div class="modal-icon">
						<svg viewBox="0 0 24 24" fill="none" xmlns="https://www.w3.org/2000/svg" class="keyboard-icon">
							<rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
							<path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						</svg>
					</div>
					<button id="shortcuts-modal-close" class="modal-close" tabindex="0" aria-label="Close Keyboard Shortcuts dialog">
						<svg viewBox="0 0 24 24" fill="none" xmlns="https://www.w3.org/2000/svg">
							<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
				</div>
				<div class="modal-body">
					<h1 class="modal-title">
						<span class="title-gradient">Keyboard Shortcuts</span>
					</h1>
					<p class="modal-subtitle">Boost your productivity with these keyboard shortcuts</p>
					<div class="shortcuts-container">
						${shortcutsHtml}
					</div>
				</div>
			</div>
		</div>
	`;
}

/**
 * Handles Escape key for closing the keyboard shortcuts modal
 *
 * @param {any} event
 */
function handleShortcutsEscapeKey(event) {
    if (event.key === "Escape") {
        const modal = document.querySelector("#keyboard-shortcuts-modal");
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
function injectKeyboardShortcutsModalStyles() {
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
/**
 * @param {any} modal
 */
function setupKeyboardShortcutsModalHandlers(modal) {
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
    addEventListenerWithCleanup(modal, "click", (/** @type {any} */ e) => {
        if (e.target === modal) {
            closeKeyboardShortcutsModal();
        }
    });

    // Handle links for external navigation
    attachExternalLinkHandlers({ root: modal });
}

/**
 * Shows the keyboard shortcuts modal with smooth animations
 */
function showKeyboardShortcutsModal() {
    console.log("showKeyboardShortcutsModal function called");
    ensureKeyboardShortcutsModal();

    const modal = document.querySelector("#keyboard-shortcuts-modal");
    console.log("Modal element found:", modal);
    if (!modal) {
        console.error(
            "Modal element not found after ensureKeyboardShortcutsModal"
        );
        return;
    }

    // Store the currently focused element
    lastFocusedElement = document.activeElement;
    // Show modal with animation
    modal.style.display = "flex";
    console.log("Modal display set to flex");

    const applyShowClass = () => {
        if (!modal.classList.contains("show")) {
            modal.classList.add("show");
            console.log("Added show class to modal");
        }
    };

    if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
            applyShowClass();
            console.log("Ensured show class via animation frame");
        });
    } else {
        console.warn(
            "requestAnimationFrame not available; applying show class synchronously"
        );
    }

    applyShowClass();

    // Focus management
    const closeBtn = modal.querySelector("#shortcuts-modal-close");
    if (closeBtn) {
        /** @type {any} */ (closeBtn).focus();
        console.log("Focus set to close button");
    } else {
        console.warn("Close button not found");
    }

    // Trap focus within modal
    trapFocusInModal(modal);

    // Prevent body scrolling
    document.body.style.overflow = "hidden";
    console.log("Body scroll prevented");
}

/**
 * Traps focus within the modal for accessibility
 *
 * @param {any} modal
 */
function trapFocusInModal(modal) {
    const focusableElements = Array.from(
        modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
    ).filter((element) => {
        const htmlElement = /** @type {HTMLElement} */ (element);
        if (htmlElement.hasAttribute("tabindex")) {
            return htmlElement.tabIndex >= 0;
        }
        return true;
    });

    if (focusableElements.length === 0) {
        return;
    }

    /**
     * @param {any} e
     */
    function handleTabKey(e) {
        if (e.key !== "Tab") {
            return;
        }

        const focusCycle = focusableElements;
        const currentActive = /** @type {HTMLElement | null} */ (
            document.activeElement
        );
        const currentIndex = currentActive
            ? focusCycle.indexOf(currentActive)
            : -1;

        e.preventDefault();
        if (!e.defaultPrevented) {
            try {
                Object.defineProperty(e, "defaultPrevented", {
                    configurable: true,
                    value: true,
                });
            } catch {
                // Ignore environments where defaultPrevented is read-only
            }
        }

        if (e.shiftKey) {
            const targetIndex =
                currentIndex <= 0 ? focusCycle.length - 1 : currentIndex - 1;
            focusCycle[targetIndex].focus();
            return;
        }

        const targetIndex =
            currentIndex === -1 || currentIndex === focusCycle.length - 1
                ? 0
                : currentIndex + 1;
        focusCycle[targetIndex].focus();
    }

    addEventListenerWithCleanup(modal, "keydown", handleTabKey, true);
}

// Export functions for external use
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        closeKeyboardShortcutsModal,
        showKeyboardShortcutsModal,
    };
}

// Also expose functions globally for direct access
globalThis.showKeyboardShortcutsModal = showKeyboardShortcutsModal;
globalThis.closeKeyboardShortcutsModal = closeKeyboardShortcutsModal;
