/**
 * Utility function to handle escape key for modal closing
 * @param {Function} closeCallback - Callback to execute on Escape
 * @returns {Function} Cleanup function to remove event listener
 */
export function handleEscapeKey(closeCallback: Function): Function;
/**
 * Utility function to inject CSS styles
 * @param {string} id - Unique ID for the style element
 * @param {string} css - CSS content
 * @returns {boolean} True if styles were injected, false if already existed
 */
export function injectStyles(id: string, css: string): boolean;
/**
 * Utility function to manage focus trap within a modal
 * @param {HTMLElement} modal - The modal element
 * @returns {Function} Cleanup function to remove event listener
 */
export function trapFocus(modal: HTMLElement): Function;
/**
 * Default animation duration for modals (in milliseconds)
 */
export const DEFAULT_MODAL_ANIMATION_DURATION: 300;
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
    constructor(config: ModalConfig);
    config: {
        /**
         * - Modal element ID
         */
        id: string;
        /**
         * - Additional CSS class names
         */
        className?: string;
        /**
         * - Animation duration in milliseconds
         */
        animationDuration: number;
        /**
         * - Whether clicking backdrop closes modal
         */
        closeOnBackdrop: boolean;
        /**
         * - Whether pressing Escape closes modal
         */
        closeOnEscape: boolean;
        /**
         * - Callback when modal is shown
         */
        onShow?: Function;
        /**
         * - Callback when modal is hidden
         */
        onHide?: Function;
    };
    /** @type {HTMLElement | null} */
    lastFocusedElement: HTMLElement | null;
    /** @type {HTMLElement | null} */
    modalElement: HTMLElement | null;
    /** @type {Set<() => void>} */
    listenerCleanups: Set<() => void>;
    /**
     * Creates the modal element if it doesn't exist
     * @param {string} content - HTML content for the modal
     * @returns {HTMLElement} The modal element
     */
    create(content: string): HTMLElement;
    /**
     * Focuses the first focusable element in the modal
     * @param {HTMLElement} modal - The modal element
     * @protected
     */
    protected focusFirstElement(modal: HTMLElement): void;
    /**
     * Hides the modal with animation
     */
    hide(): void;
    /**
     * Register a listener cleanup function for later teardown.
     * @param {(() => void) | undefined} cleanup
     * @protected
     */
    protected registerCleanup(cleanup: (() => void) | undefined): void;
    /**
     * Sets up event listeners for the modal
     * @param {HTMLElement} modal - The modal element
     * @protected
     */
    protected setupEventListeners(modal: HTMLElement): void;
    /**
     * Sets up external links to open in the system browser
     * @param {HTMLElement} modal - The modal element
     * @protected
     */
    protected setupExternalLinks(modal: HTMLElement): void;
    /**
     * Shows the modal with animation
     * @param {string} content - HTML content for the modal
     */
    show(content: string): Promise<void>;
    /**
     * Remove and clear all registered event listeners.
     * @protected
     */
    protected teardownEventListeners(): void;
}
export type ModalConfig = {
    /**
     * - Modal element ID
     */
    id: string;
    /**
     * - Additional CSS class names
     */
    className?: string;
    /**
     * - Animation duration in milliseconds
     */
    animationDuration?: number;
    /**
     * - Whether clicking backdrop closes modal
     */
    closeOnBackdrop?: boolean;
    /**
     * - Whether pressing Escape closes modal
     */
    closeOnEscape?: boolean;
    /**
     * - Callback when modal is shown
     */
    onShow?: Function;
    /**
     * - Callback when modal is hidden
     */
    onHide?: Function;
};
//# sourceMappingURL=baseModal.d.ts.map