/**
 * @fileoverview Base Modal Utility
 * @description Provides common modal functionality to reduce code duplication
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";

/**
 * Default animation duration for modals (in milliseconds)
 */
export const DEFAULT_MODAL_ANIMATION_DURATION = 300;

/**
 * @typedef {Object} ModalConfig
 * @property {string} id - Modal element ID
 * @property {string} [className] - Additional CSS class names
 * @property {number} [animationDuration] - Animation duration in milliseconds
 * @property {boolean} [closeOnBackdrop] - Whether clicking backdrop closes modal
 * @property {boolean} [closeOnEscape] - Whether pressing Escape closes modal
 * @property {Function} [onShow] - Callback when modal is shown
 * @property {Function} [onHide] - Callback when modal is hidden
 */

/**
 * Base Modal class for managing modal dialogs
 */
export class BaseModal {
    /**
     * @param {ModalConfig} config - Modal configuration
     */
    constructor(config) {
        this.config = {
            animationDuration: DEFAULT_MODAL_ANIMATION_DURATION,
            closeOnBackdrop: true,
            closeOnEscape: true,
            ...config,
        };

        /** @type {HTMLElement | null} */
        this.lastFocusedElement = null;

        /** @type {HTMLElement | null} */
        this.modalElement = null;

        /** @type {Set<() => void>} */
        this.listenerCleanups = new Set();
    }

    /**
     * Creates the modal element if it doesn't exist
     * @param {string} content - HTML content for the modal
     * @returns {HTMLElement} The modal element
     */
    create(content) {
        let modal = document.getElementById(this.config.id);

        if (!modal) {
            modal = document.createElement("div");
            modal.id = this.config.id;
            modal.className = `modal${this.config.className ? ` ${this.config.className}` : ""}`;
            modal.style.display = "none";
            document.body.append(modal);
        }

        modal.innerHTML = content;
        this.modalElement = modal;
        return modal;
    }

    /**
     * Focuses the first focusable element in the modal
     * @param {HTMLElement} modal - The modal element
     * @protected
     */
    focusFirstElement(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length > 0) {
			/** @type {HTMLElement} */ (focusableElements[0]).focus();
        }
    }

    /**
     * Hides the modal with animation
     */
    hide() {
        const modal = this.modalElement ?? document.getElementById(this.config.id);

        if (!modal) {
            return;
        }

        this.teardownEventListeners();

        // Start closing animation
        modal.classList.remove("show");

        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = "none";

            // Restore focus
            this.lastFocusedElement?.focus();
            this.lastFocusedElement = null;

            // Call onHide callback
            this.config.onHide?.();
        }, this.config.animationDuration);
    }

    /**
     * Register a listener cleanup function for later teardown.
     * @param {(() => void) | undefined} cleanup
     * @protected
     */
    registerCleanup(cleanup) {
        if (typeof cleanup === "function") {
            this.listenerCleanups.add(cleanup);
        }
    }

    /**
     * Sets up event listeners for the modal
     * @param {HTMLElement} modal - The modal element
     * @protected
     */
    setupEventListeners(modal) {
        this.teardownEventListeners();

        // Close button
        const closeBtn = modal.querySelector(`#${this.config.id}-close, .modal-close`);
        if (closeBtn) {
            this.registerCleanup(
                addEventListenerWithCleanup(closeBtn, "click", (e) => {
                    e.preventDefault();
                    this.hide();
                })
            );

            this.registerCleanup(
                addEventListenerWithCleanup(closeBtn, "keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        this.hide();
                    }
                })
            );
        }

        // Close on backdrop click
        if (this.config.closeOnBackdrop) {
            this.registerCleanup(
                addEventListenerWithCleanup(modal, "click", (e) => {
                    if (e.target === modal) {
                        this.hide();
                    }
                })
            );

            // Prevent modal content clicks from closing modal
            const modalContent = modal.querySelector(".modal-content");
            if (modalContent) {
                this.registerCleanup(
                    addEventListenerWithCleanup(/** @type {HTMLElement} */(modalContent), "click", (e) => {
                        e.stopPropagation();
                    })
                );
            }
        }

        // Close on Escape key
        if (this.config.closeOnEscape) {
            const handleEscape = (/** @type {KeyboardEvent} */ e) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    this.hide();
                }
            };
            this.registerCleanup(addEventListenerWithCleanup(document, "keydown", handleEscape, true));
        }
    }

    /**
     * Sets up external links to open in the system browser
     * @param {HTMLElement} modal - The modal element
     * @protected
     */
    setupExternalLinks(modal) {
        const externalLinks = modal.querySelectorAll("[data-external-link]");

        for (const link of externalLinks) {
            this.registerCleanup(
                addEventListenerWithCleanup(/** @type {HTMLElement} */(link), "click", (e) => {
                    e.preventDefault();
                    const url = /** @type {HTMLElement} */ (link).getAttribute("href");

                    if (url && globalThis.electronAPI?.openExternal) {
                        globalThis.electronAPI.openExternal(url);
                    } else if (url) {
                        // Fallback for non-Electron environments
                        window.open(url, "_blank", "noopener,noreferrer");
                    }
                })
            );

            this.registerCleanup(
                addEventListenerWithCleanup(/** @type {HTMLElement} */(link), "keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        const url = /** @type {HTMLElement} */ (link).getAttribute("href");

                        if (url && globalThis.electronAPI?.openExternal) {
                            globalThis.electronAPI.openExternal(url);
                        } else if (url) {
                            // Fallback for non-Electron environments
                            window.open(url, "_blank", "noopener,noreferrer");
                        }
                    }
                })
            );
        }
    }

    /**
     * Shows the modal with animation
     * @param {string} content - HTML content for the modal
     */
    async show(content) {
        const modal = this.create(content);

        // Save current focus
        this.lastFocusedElement = /** @type {HTMLElement | null} */ (document.activeElement);

        // Show modal with animation
        modal.style.display = "flex";

        // Trigger animation on next frame
        requestAnimationFrame(() => {
            modal.classList.add("show");
        });

        // Setup event listeners
        this.setupEventListeners(modal);

        // Focus management
        setTimeout(() => {
            this.focusFirstElement(modal);
        }, this.config.animationDuration);

        // Call onShow callback
        this.config.onShow?.();
    }

    /**
     * Remove and clear all registered event listeners.
     * @protected
     */
    teardownEventListeners() {
        if (!this.listenerCleanups.size) {
            return;
        }
        for (const cleanup of this.listenerCleanups) {
            try {
                cleanup();
            } catch (error) {
                console.warn("[BaseModal] Failed to cleanup listener", error);
            }
        }
        this.listenerCleanups.clear();
    }
}

/**
 * Utility function to handle escape key for modal closing
 * @param {Function} closeCallback - Callback to execute on Escape
 * @returns {Function} Cleanup function to remove event listener
 */
export function handleEscapeKey(closeCallback) {
    const handler = (/** @type {KeyboardEvent} */ e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            closeCallback();
        }
    };

    document.addEventListener("keydown", handler, true);

    return () => {
        document.removeEventListener("keydown", handler, true);
    };
}

/**
 * Utility function to inject CSS styles
 * @param {string} id - Unique ID for the style element
 * @param {string} css - CSS content
 * @returns {boolean} True if styles were injected, false if already existed
 */
export function injectStyles(id, css) {
    if (document.getElementById(id)) {
        return false;
    }

    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.append(style);

    return true;
}

/**
 * Utility function to manage focus trap within a modal
 * @param {HTMLElement} modal - The modal element
 * @returns {Function} Cleanup function to remove event listener
 */
export function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length === 0) {
        return () => { };
    }

    const focusable = Array.from(focusableElements, (el) => /** @type {HTMLElement} */(el));
    const [firstElement] = focusable;
    const lastElement = focusable.at(-1);

    if (!firstElement || !lastElement) {
        return () => { };
    }

    const handler = (/** @type {KeyboardEvent} */ e) => {
        if (e.key !== "Tab") {
            return;
        }

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    };

    modal.addEventListener("keydown", handler);

    return () => {
        modal.removeEventListener("keydown", handler);
    };
}
