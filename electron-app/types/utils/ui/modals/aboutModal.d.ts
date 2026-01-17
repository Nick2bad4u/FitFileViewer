/**
 * Creates the enhanced modal content with modern styling and branding
 * Uses dynamic loading values that will be replaced by loadVersionInfo()
 * @returns {string} HTML content for the modal
 */
export function getAboutModalContent(): string;
/**
 * Enhanced escape key handler with better UX
 * @param {*} e
 */
export function handleEscapeKey(e: any): void;
/**
 * Enhanced modal display function with animations and improved accessibility
 * @param {string} html - HTML content to display in the modal body
 */
export function showAboutModal(html?: string): void;
export const modalAnimationDuration: number;
