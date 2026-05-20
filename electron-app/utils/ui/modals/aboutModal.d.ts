/** Creates the About modal content tree. */
export function createAboutModalContentElement(): HTMLElement;

/** Handles Escape key presses for the About modal. */
export function handleEscapeKey(event: KeyboardEvent): void;

/** Duration, in milliseconds, used by About modal show and hide animations. */
export const modalAnimationDuration: number;

/** Shows the About modal with optional sanitized body HTML. */
export function showAboutModal(html?: string): void;
