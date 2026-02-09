/**
 * Enhanced About Modal Dialog Utility Provides modern design and animations
 * with dynamic version loading.
 */

import { loadVersionInfo } from "../../app/initialization/loadVersionInfo.js";
import { exportUtils } from "../../files/export/exportUtils.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { attachExternalLinkHandlers } from "../links/externalLinkHandlers.js";
import { showNotification } from "../notifications/showNotification.js";
import { ensureAboutModal } from "./ensureAboutModal.js";
import { injectModalStyles } from "./injectModalStyles.js";

// Constants for better maintainability
const CONSTANTS = {
    DEFAULT_VALUES: {
        AUTHOR: "Nick2bad4u",
        CHROME: "Loading...",
        ELECTRON: "Loading...",
        LICENSE: "Unlicense",
        NODE: "Loading...",
        PLATFORM: "Loading...",
        VERSION: "Loading...",
    },
    LOG_PREFIX: "[AboutModal]",
    MODAL_ANIMATION_DURATION: 300,
};

// Module state
/** @type {HTMLElement | null} */
let lastFocusedElement = null;
export const modalAnimationDuration = CONSTANTS.MODAL_ANIMATION_DURATION;

/**
 * Creates the enhanced modal content with modern styling and branding Uses
 * dynamic loading values that will be replaced by loadVersionInfo()
 *
 * @returns {string} HTML content for the modal
 */
export function getAboutModalContent() {
    return `
		<div class="modal-backdrop">
			<div class="modal-content">
				<div class="modal-header">
					<div class="modal-icon">
						<img src="icons/favicon-96x96.png" alt="App Icon" class="app-icon" />
					</div>
					<button id="about-modal-close" class="modal-close" tabindex="0" aria-label="Close About dialog">
						<svg viewBox="0 0 24 24" fill="none" xmlns="https://www.w3.org/2000/svg">
							<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
                </div>
                <div class="modal-body">
                    <h1 class="modal-title">
						<span class="title-gradient">Fit File Viewer</span>
						<span class="version-badge">
							<span class="version-prefix">v</span>
							<span class="version-number" id="version-number">${CONSTANTS.DEFAULT_VALUES.VERSION}</span>
						</span>
					</h1>
					<p class="modal-subtitle">Advanced FIT file analysis and visualization tool</p>

                    <div class="about-split">
                        <section class="about-panel about-panel--features" aria-label="Key features">
                            ${createFeaturesContent()}
                        </section>
                        <section class="about-panel about-panel--system" aria-label="System information">
                            <div class="about-panel-header">
                                <h3 class="features-title"><span>🧩</span> System Info</h3>
                                <button
                                    id="about-copy-system-info"
                                    class="features-btn features-btn--compact"
                                    type="button"
                                    tabindex="0"
                                    aria-label="Copy system information to clipboard"
                                >
                                    <span class="btn-icon">📋</span>
                                    <span class="btn-text">Copy</span>
                                </button>
                            </div>
                            <div class="system-info-section" id="info-toggle-section">
                                ${createSystemInfoContent()}
                            </div>
                        </section>
                    </div>
					<div id="about-modal-body" class="modal-content-body"></div>
					<div class="modal-footer">
						<div class="tech-stack">
							<a href="https://electronjs.org/" class="tech-badge-link" data-external-link>
								<span class="tech-badge">
									<span class="tech-icon">⚡</span>
									<span>Electron</span>
								</span>
							</a>
							<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" class="tech-badge-link" data-external-link>
								<span class="tech-badge">
									<span class="tech-icon">📜</span>
									<span>JavaScript</span>
								</span>
							</a>
							<a href="https://github.com/chartjs/Chart.js" class="tech-badge-link" data-external-link>
								<span class="tech-badge">
									<span class="tech-icon">📊</span>
									<span>Chart.js</span>
								</span>
							</a>
							<a href="https://github.com/Leaflet/Leaflet" class="tech-badge-link" data-external-link>
								<span class="tech-badge">
									<span class="tech-icon">🗺️</span>
									<span>Leaflet</span>
								</span>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;
}

/**
 * Enhanced escape key handler with better UX
 *
 * @param {any} e
 */
export function handleEscapeKey(e) {
    if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        hideAboutModal();
    }
}

/**
 * Enhanced modal display function with animations and improved accessibility
 *
 * @param {string} html - HTML content to display in the modal body
 */
export function showAboutModal(html = "") {
    ensureAboutModal();
    const modal = document.querySelector("#about-modal");
    if (modal) {
        const body = document.querySelector("#about-modal-body"),
            closeBtn = document.querySelector("#about-modal-close"),
            copyBtn = document.querySelector("#about-copy-system-info");

        if (body && closeBtn) {
            // Set content
            body.replaceChildren();
            if (html) {
                body.append(sanitizeAboutBodyHtml(html));
            }

            // Save current focus
            lastFocusedElement = /** @type {HTMLElement} */ (
                document.activeElement
            );

            // Show modal with animation
            modal.style.display = "flex";

            // Trigger animation on next frame
            requestAnimationFrame(() => {
                modal.classList.add("show");
            });

            // Set up event listeners
            addEventListenerWithCleanup(closeBtn, "click", (e) => {
                e.preventDefault();
                hideAboutModal();
            });

            addEventListenerWithCleanup(closeBtn, "keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    hideAboutModal();
                }
            });

            if (copyBtn) {
                const runCopy = async () => {
                    const text = buildSystemInfoClipboardText();
                    const ok = await exportUtils.copyTextToClipboard(text);
                    if (ok) {
                        showNotification(
                            "System info copied to clipboard",
                            "success",
                            2500
                        );
                        // Brief UX feedback on the button itself.
                        try {
                            const btnText = copyBtn.querySelector(".btn-text");
                            if (btnText) {
                                const prev = btnText.textContent;
                                btnText.textContent = "Copied";
                                setTimeout(() => {
                                    btnText.textContent = prev || "Copy";
                                }, 1200);
                            }
                        } catch {
                            /* ignore */
                        }
                    } else {
                        showNotification(
                            "Failed to copy system info",
                            "error",
                            3000
                        );
                    }
                };

                addEventListenerWithCleanup(copyBtn, "click", (e) => {
                    e.preventDefault();
                    void runCopy();
                });

                addEventListenerWithCleanup(copyBtn, "keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        void runCopy();
                    }
                });
            }
            // No toggle button: features + system info are displayed together.

            // Handle external links to open in user's default browser.
            // NOTE: The modal content container stops propagation to prevent backdrop-closing.
            // Attach handlers to .modal-content so delegated link clicks are still observed.
            const modalContentForLinks =
                modal.querySelector(".modal-content") ?? modal;
            attachExternalLinkHandlers({ root: modalContentForLinks });

            // Close on backdrop click
            addEventListenerWithCleanup(modal, "click", (e) => {
                if (e.target === modal) {
                    hideAboutModal();
                }
            });

            // Prevent modal content clicks from closing modal
            const modalContent = modal.querySelector(".modal-content");
            if (modalContent) {
                addEventListenerWithCleanup(
                    /** @type {HTMLElement} */ (modalContent),
                    "click",
                    (e) => {
                        e.stopPropagation();
                    }
                );
            }

            // Focus management - focus close button after animation
            setTimeout(() => {
                closeBtn.focus();
            }, modalAnimationDuration);

            // Load version information after modal is displayed
            try {
                loadVersionInfo();
            } catch (error) {
                console.warn(
                    `${CONSTANTS.LOG_PREFIX} Failed to load version info on modal show:`,
                    error
                );
            }
            // Sound functionality removed as requested
        }
    }
}

/**
 * Build a human-friendly clipboard payload from the About modal's system info.
 * Falls back gracefully if the DOM isn't present.
 *
 * @returns {string}
 */
function buildSystemInfoClipboardText() {
    try {
        /** @type {string[]} */
        const lines = ["Fit File Viewer – System Info"];

        const versionNumber = document.querySelector("#version-number");
        if (versionNumber && versionNumber.textContent) {
            lines.push(`App Version: ${versionNumber.textContent.trim()}`);
        }

        const items = document.querySelectorAll(
            "#info-toggle-section .system-info-item"
        );

        for (const item of Array.from(items)) {
            const labelEl = item.querySelector(".system-info-label");
            const valueEl = item.querySelector(".system-info-value");
            const labelRaw = labelEl?.textContent
                ? labelEl.textContent.trim()
                : "";
            const valueRaw = valueEl?.textContent
                ? valueEl.textContent.trim()
                : "";
            if (labelRaw && valueRaw) {
                lines.push(`${labelRaw}: ${valueRaw}`);
            }
        }

        return lines.join("\n");
    } catch {
        return "Fit File Viewer – System Info";
    }
}

/**
 * Creates and returns the features content HTML
 */
function createFeaturesContent() {
    return `
		<div class="features-content">
			<h3 class="features-title">
				<span>✨</span> Key Features
			</h3>
			<ul class="features-list">
				<li class="features-item">
					<span class="features-icon" style="color: #4ade80;">📊</span>
					<div class="features-content-item">
						<h4 class="features-item-title">Data Analysis</h4>
						<p class="features-item-description">View detailed FIT file data in interactive tables with sorting and filtering</p>
					</div>
				</li>
				<li class="features-item">
					<span class="features-icon" style="color: #60a5fa;">🗺️</span>
					<div class="features-content-item">
						<h4 class="features-item-title">GPS Mapping</h4>
						<p class="features-item-description">Interactive maps with route visualization, elevation profiles, and GPX export</p>
					</div>
				</li>
				<li class="features-item">
					<span class="features-icon" style="color: #f472b6;">📈</span>
					<div class="features-content-item">
						<h4 class="features-item-title">Performance Metrics</h4>
						<p class="features-item-description">Advanced charts and graphs for analyzing performance trends</p>
					</div>
				</li>
				<li class="features-item">
					<span class="features-icon" style="color: #34d399;">💾</span>
					<div class="features-content-item">
						<h4 class="features-item-title">Data Export</h4>
						<p class="features-item-description">Export data to CSV, GPX, and other formats for further analysis</p>
					</div>
				</li>
				<li class="features-item">
					<span class="features-icon" style="color: #fbbf24;">🔧</span>
					<div class="features-content-item">
						<h4 class="features-item-title">File Recovery</h4>
						<p class="features-item-description">Repair corrupted FIT files for import into Garmin Connect, Strava, etc.</p>
					</div>
				</li>
				<li class="features-item">
					<span class="features-icon" style="color: #a78bfa;">⚡</span>
					<div class="features-content-item">
						<h4 class="features-item-title">Cross-Platform</h4>
						<p class="features-item-description">Native desktop application for Windows, macOS, and Linux</p>
					</div>
				</li>
			</ul>
		</div>
	`;
}

/**
 * Creates and returns the system info content HTML with dynamic loading values
 *
 * @returns {string} HTML content for system information grid
 */
function createSystemInfoContent() {
    return `
		<div class="system-info-grid">
			<div class="system-info-item">
				<span class="system-info-label">Version</span>
				<span class="system-info-value version-highlight">${CONSTANTS.DEFAULT_VALUES.VERSION}</span>
			</div>
			<div class="system-info-item">
				<span class="system-info-label">Electron</span>
				<span class="system-info-value electron-highlight">${CONSTANTS.DEFAULT_VALUES.ELECTRON}</span>
			</div>
			<div class="system-info-item">
				<span class="system-info-label">Node.js</span>
				<span class="system-info-value node-highlight">${CONSTANTS.DEFAULT_VALUES.NODE}</span>
			</div>
			<div class="system-info-item">
				<span class="system-info-label">Chrome</span>
				<span class="system-info-value chrome-highlight">${CONSTANTS.DEFAULT_VALUES.CHROME}</span>
			</div>
			<div class="system-info-item">
				<span class="system-info-label">Platform</span>
				<span class="system-info-value platform-highlight">${CONSTANTS.DEFAULT_VALUES.PLATFORM}</span>
			</div>
			<div class="system-info-item">
				<span class="system-info-label">Author</span>
				<span class="system-info-value author-highlight">${CONSTANTS.DEFAULT_VALUES.AUTHOR}</span>
			</div>
			<div class="system-info-item">
				<span class="system-info-label">License</span>
				<span class="system-info-value license-highlight">${CONSTANTS.DEFAULT_VALUES.LICENSE}</span>
			</div>
		</div>
	`;
}

/**
 * Enhanced modal hide function with smooth animations
 */
function hideAboutModal() {
    const modal = document.querySelector("#about-modal");
    if (modal) {
        // Start closing animation
        modal.classList.remove("show");

        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = "none";

            // No toggle state to reset.

            // Restore focus to last focused element
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }

            // Clean up event listeners
            document.removeEventListener("keydown", handleEscapeKey, true);
        }, modalAnimationDuration);
    }
}

/**
 * Sanitize HTML inserted into the About modal body.
 *
 * Rationale:
 *
 * - The About modal accepts an HTML string (used by tests and internal helpers).
 * - Avoid letting unexpected values (e.g., file paths or externally sourced
 *   strings) inject script tags, inline event handlers, or javascript: URLs.
 *
 * This sanitizer is intentionally minimal and UI-friendly (keeps common
 * formatting tags and inline styles), while blocking the common high-risk
 * vectors.
 *
 * @param {string} html
 *
 * @returns {DocumentFragment}
 */
function sanitizeAboutBodyHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;

    /** @type {Set<string>} */
    const blockedTags = new Set([
        "EMBED",
        "IFRAME",
        "LINK",
        "META",
        "OBJECT",
        "SCRIPT",
    ]);

    const walker = document.createTreeWalker(
        template.content,
        NodeFilter.SHOW_ELEMENT
    );
    /** @type {Element[]} */
    const nodesToRemove = [];

    while (walker.nextNode()) {
        const el = /** @type {Element} */ (walker.currentNode);
        if (blockedTags.has(el.tagName)) {
            nodesToRemove.push(el);
            continue;
        }

        // Strip inline event handlers and dangerous URL-based attributes.
        for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            const value = String(attr.value);

            if (name.startsWith("on")) {
                el.removeAttribute(attr.name);
                continue;
            }

            if (name === "href" || name === "src") {
                const trimmed = value.trim();
                const lower = trimmed.toLowerCase();
                const isHttp =
                    lower.startsWith("http://") || lower.startsWith("https://");
                const isMailto = lower.startsWith("mailto:");

                if (!isHttp && !isMailto) {
                    el.removeAttribute(attr.name);
                }

                continue;
            }

            // Avoid CSS-based resource loading via url(...). Keep benign inline styles.
            if (name === "style") {
                const lower = value.toLowerCase();
                if (lower.includes("url(") || lower.includes("expression(")) {
                    el.removeAttribute(attr.name);
                }
            }
        }

        // Force http(s) links to be treated as external links handled by the modal.
        if (el.tagName === "A") {
            const href = el.getAttribute("href");
            if (
                href &&
                (href.startsWith("http://") ||
                    href.startsWith("https://") ||
                    href.startsWith("mailto:"))
            ) {
                el.dataset.externalLink = "";
                el.setAttribute("rel", "noopener noreferrer");
            }
        }
    }

    for (const node of nodesToRemove) {
        node.remove();
    }

    return template.content;
}

/**
 * Development helpers for testing and debugging
 */
const devHelpers = {
    /**
     * Show modal with sample content for testing
     */ /**
     * Reset all styles and recreate modal
     */
    reset: () => {
        const existingModal = document.querySelector("#about-modal"),
            existingStyles = document.querySelector("#about-modal-styles");

        if (existingModal) {
            existingModal.remove();
        }
        if (existingStyles) {
            existingStyles.remove();
        }

        ensureAboutModal();
    },

    showSample: () => {
        const sampleContent = `
			<h3 style="color: var(--color-fg); opacity: 0.9; margin-top: 0;">Sample Content</h3>
			<p style="color: var(--color-fg); opacity: 0.8;">This is a sample modal with some content to demonstrate the enhanced styling and features.</p>
			<ul style="color: var(--color-fg); opacity: 0.8; text-align: left;">
				<li>Enhanced animations and transitions</li>
				<li>Modern glassmorphism design</li>
				<li>Responsive layout</li>
				<li>Improved accessibility</li>
				<li>Dynamic version loading</li>
			</ul>
		`;
        showAboutModal(sampleContent);
    },

    /**
     * Test modal animations
     */
    testAnimations: () => {
        const modal = document.querySelector("#about-modal");
        if (modal) {
            modal.style.transition = "all 1000ms ease";
            const modalContent = modal.querySelector(".modal-content");
            if (modalContent) {
                /** @type {HTMLElement} */ (modalContent).style.transition =
                    "transform 1000ms cubic-bezier(0.34, 1.56, 0.64, 1)";
            }
        }
        devHelpers.showSample();
    },
};

// Export development helpers in development mode
if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "development"
) {
    globalThis.aboutModalDevHelpers = devHelpers;
}

// Initialize modal styles when module loads
if (typeof document !== "undefined" && document.readyState === "loading") {
    addEventListenerWithCleanup(document, "DOMContentLoaded", () => {
        // Pre-initialize styles for better performance
        injectModalStyles();
    });
} else if (typeof document !== "undefined") {
    // Document already loaded, initialize immediately
    injectModalStyles();
}
