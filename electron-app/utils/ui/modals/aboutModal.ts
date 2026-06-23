/**
 * Enhanced About Modal Dialog Utility Provides modern design and animations
 * with dynamic version loading.
 */

import { loadVersionInfo } from "../../app/initialization/loadVersionInfo.js";
import { exportUtils } from "../../files/export/exportUtils.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { attachExternalLinkHandlers } from "../links/externalLinkHandlers.js";
import { showNotification } from "../notifications/showNotification.js";
import {
    getAboutModalRuntime,
    type AboutModalTimerHandle,
} from "./aboutModalRuntime.js";
import { ensureAboutModal } from "./ensureAboutModal.js";
import { injectModalStyles } from "./injectModalStyles.js";
import { createModalFocusTrap } from "./modalFocusTrap.js";

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
} as const;
const SVG_NS = "http://www.w3.org/2000/svg";

type FeatureItem = {
    color: string;
    description: string;
    icon: string;
    title: string;
};

type SystemInfoItem = {
    label: string;
    valueClass: string;
    valueKey: keyof typeof CONSTANTS.DEFAULT_VALUES;
};

type TechBadge = {
    href: string;
    icon: string;
    label: string;
};

type ClipboardExportUtils = typeof exportUtils & {
    copyTextToClipboard?: (text: string) => Promise<boolean>;
};

const clipboardExportUtils = exportUtils as ClipboardExportUtils;
const aboutModalRuntime = getAboutModalRuntime();

const FEATURE_ITEMS: FeatureItem[] = [
    {
        color: "#4ade80",
        description:
            "View detailed FIT file data in interactive tables with sorting and filtering",
        icon: "📊",
        title: "Data Analysis",
    },
    {
        color: "#60a5fa",
        description:
            "Interactive maps with route visualization, elevation profiles, and GPX export",
        icon: "🗺️",
        title: "GPS Mapping",
    },
    {
        color: "#f472b6",
        description:
            "Advanced charts and graphs for analyzing performance trends",
        icon: "📈",
        title: "Performance Metrics",
    },
    {
        color: "#34d399",
        description:
            "Export data to CSV, GPX, and other formats for further analysis",
        icon: "💾",
        title: "Data Export",
    },
    {
        color: "#fbbf24",
        description:
            "Repair corrupted FIT files for import into Garmin Connect, Strava, etc.",
        icon: "🔧",
        title: "File Recovery",
    },
    {
        color: "#a78bfa",
        description: "Native desktop application for Windows, macOS, and Linux",
        icon: "⚡",
        title: "Cross-Platform",
    },
];

const SYSTEM_INFO_ITEMS: SystemInfoItem[] = [
    {
        label: "Version",
        valueClass: "version-highlight",
        valueKey: "VERSION",
    },
    {
        label: "Electron",
        valueClass: "electron-highlight",
        valueKey: "ELECTRON",
    },
    {
        label: "Node.js",
        valueClass: "node-highlight",
        valueKey: "NODE",
    },
    {
        label: "Chrome",
        valueClass: "chrome-highlight",
        valueKey: "CHROME",
    },
    {
        label: "Platform",
        valueClass: "platform-highlight",
        valueKey: "PLATFORM",
    },
    {
        label: "Author",
        valueClass: "author-highlight",
        valueKey: "AUTHOR",
    },
    {
        label: "License",
        valueClass: "license-highlight",
        valueKey: "LICENSE",
    },
];

const TECH_BADGES: TechBadge[] = [
    {
        href: "https://electronjs.org/",
        icon: "⚡",
        label: "Electron",
    },
    {
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        icon: "📜",
        label: "JavaScript",
    },
    {
        href: "https://github.com/chartjs/Chart.js",
        icon: "📊",
        label: "Chart.js",
    },
    {
        href: "https://github.com/Leaflet/Leaflet",
        icon: "🗺️",
        label: "Leaflet",
    },
];

// Module state
let copyFeedbackTimer: AboutModalTimerHandle | null = null;
let escapeKeyCleanup: (() => void) | null = null;
let focusTimer: AboutModalTimerHandle | null = null;
let focusTrapCleanup: (() => void) | null = null;
let hideTimer: AboutModalTimerHandle | null = null;
let lastFocusedElement: HTMLElement | null = null;
let modalEventCleanups: Array<() => void> = [];
let showAnimationFrame: number | null = null;

/**
 * Duration used by the About modal show/hide animation.
 */
export const modalAnimationDuration = CONSTANTS.MODAL_ANIMATION_DURATION;

/**
 * Creates the About modal content as DOM nodes.
 */
export function createAboutModalContentElement(): HTMLElement {
    const backdrop = aboutModalRuntime.createElement("div");
    backdrop.className = "modal-backdrop";

    const content = aboutModalRuntime.createElement("div");
    content.className = "modal-content";

    const header = aboutModalRuntime.createElement("div");
    header.className = "modal-header";

    const iconWrapper = aboutModalRuntime.createElement("div");
    iconWrapper.className = "modal-icon";
    const appIcon = aboutModalRuntime.createElement("img");
    appIcon.src = "icons/favicon-96x96.png";
    appIcon.alt = "App Icon";
    appIcon.className = "app-icon";
    iconWrapper.append(appIcon);

    const closeButton = aboutModalRuntime.createElement("button");
    closeButton.id = "about-modal-close";
    closeButton.className = "modal-close";
    closeButton.type = "button";
    closeButton.tabIndex = 0;
    closeButton.setAttribute("aria-label", "Close About dialog");
    closeButton.append(createCloseIcon());

    header.append(iconWrapper, closeButton);

    const body = aboutModalRuntime.createElement("div");
    body.className = "modal-body";
    body.append(
        createAboutTitle(),
        createTextElement(
            "p",
            "modal-subtitle",
            "Advanced FIT file analysis and visualization tool"
        ),
        createAboutSplit(),
        createEmptyAboutBody(),
        createAboutFooter()
    );

    content.append(header, body);
    backdrop.append(content);

    return backdrop;
}

function createCloseIcon(): SVGSVGElement {
    const icon = aboutModalRuntime.createSvgElement("svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("xmlns", SVG_NS);

    const path = aboutModalRuntime.createSvgElement("path");
    path.setAttribute("d", "M18 6L6 18M6 6l12 12");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    icon.append(path);

    return icon;
}

function createAboutTitle(): HTMLHeadingElement {
    const title = aboutModalRuntime.createElement("h1");
    title.id = "about-modal-title";
    title.className = "modal-title";

    title.append(
        createTextElement("span", "title-gradient", "Fit File Viewer"),
        createVersionBadge()
    );

    return title;
}

function createVersionBadge(): HTMLSpanElement {
    const badge = aboutModalRuntime.createElement("span");
    badge.className = "version-badge";

    const prefix = createTextElement("span", "version-prefix", "v");
    const version = createTextElement(
        "span",
        "version-number",
        CONSTANTS.DEFAULT_VALUES.VERSION
    );
    version.id = "version-number";
    badge.append(prefix, version);

    return badge;
}

function createAboutSplit(): HTMLElement {
    const split = aboutModalRuntime.createElement("div");
    split.className = "about-split";

    const featuresPanel = aboutModalRuntime.createElement("section");
    featuresPanel.className = "about-panel about-panel--features";
    featuresPanel.setAttribute("aria-label", "Key features");
    featuresPanel.append(createFeaturesElement());

    const systemPanel = aboutModalRuntime.createElement("section");
    systemPanel.className = "about-panel about-panel--system";
    systemPanel.setAttribute("aria-label", "System information");
    systemPanel.append(
        createSystemInfoPanelHeader(),
        createSystemInfoSection()
    );

    split.append(featuresPanel, systemPanel);

    return split;
}

function createFeaturesElement(): HTMLElement {
    const content = aboutModalRuntime.createElement("div");
    content.className = "features-content";

    const title = aboutModalRuntime.createElement("h3");
    title.className = "features-title";
    title.append(createTextElement("span", "", "✨"), " Key Features");

    const list = aboutModalRuntime.createElement("ul");
    list.className = "features-list";
    for (const item of FEATURE_ITEMS) {
        list.append(createFeatureItem(item));
    }

    content.append(title, list);

    return content;
}

function createFeatureItem(item: FeatureItem): HTMLElement {
    const listItem = aboutModalRuntime.createElement("li");
    listItem.className = "features-item";

    const icon = createTextElement("span", "features-icon", item.icon);
    icon.style.color = item.color;

    const content = aboutModalRuntime.createElement("div");
    content.className = "features-content-item";
    content.append(
        createTextElement("h4", "features-item-title", item.title),
        createTextElement("p", "features-item-description", item.description)
    );

    listItem.append(icon, content);

    return listItem;
}

function createSystemInfoPanelHeader(): HTMLElement {
    const header = aboutModalRuntime.createElement("div");
    header.className = "about-panel-header";

    const title = aboutModalRuntime.createElement("h3");
    title.className = "features-title";
    title.append(createTextElement("span", "", "🧩"), " System Info");

    const button = aboutModalRuntime.createElement("button");
    button.id = "about-copy-system-info";
    button.className = "features-btn features-btn--compact";
    button.type = "button";
    button.tabIndex = 0;
    button.setAttribute("aria-label", "Copy system information to clipboard");
    button.append(
        createTextElement("span", "btn-icon", "📋"),
        createTextElement("span", "btn-text", "Copy")
    );

    header.append(title, button);

    return header;
}

function createSystemInfoSection(): HTMLElement {
    const section = aboutModalRuntime.createElement("div");
    section.className = "system-info-section";
    section.id = "info-toggle-section";
    section.append(createSystemInfoGridElement());

    return section;
}

function createSystemInfoGridElement(): HTMLElement {
    const grid = aboutModalRuntime.createElement("div");
    grid.className = "system-info-grid";
    for (const item of SYSTEM_INFO_ITEMS) {
        grid.append(createSystemInfoItem(item));
    }

    return grid;
}

function createSystemInfoItem(item: SystemInfoItem): HTMLElement {
    const wrapper = aboutModalRuntime.createElement("div");
    wrapper.className = "system-info-item";
    wrapper.append(
        createTextElement("span", "system-info-label", item.label),
        createTextElement(
            "span",
            `system-info-value ${item.valueClass}`,
            CONSTANTS.DEFAULT_VALUES[item.valueKey]
        )
    );

    return wrapper;
}

function createEmptyAboutBody(): HTMLElement {
    const body = aboutModalRuntime.createElement("div");
    body.id = "about-modal-body";
    body.className = "modal-content-body";

    return body;
}

function createAboutFooter(): HTMLElement {
    const footer = aboutModalRuntime.createElement("div");
    footer.className = "modal-footer";

    const stack = aboutModalRuntime.createElement("div");
    stack.className = "tech-stack";
    for (const badge of TECH_BADGES) {
        stack.append(createTechBadgeLink(badge));
    }
    footer.append(stack);

    return footer;
}

function createTechBadgeLink(badge: TechBadge): HTMLAnchorElement {
    const link = aboutModalRuntime.createElement("a");
    link.href = badge.href;
    link.className = "tech-badge-link";
    link.dataset["externalLink"] = "";

    const wrapper = aboutModalRuntime.createElement("span");
    wrapper.className = "tech-badge";
    wrapper.append(
        createTextElement("span", "tech-icon", badge.icon),
        createTextElement("span", "", badge.label)
    );
    link.append(wrapper);

    return link;
}

function createTextElement<T extends keyof HTMLElementTagNameMap>(
    tagName: T,
    className: string,
    text: string
): HTMLElementTagNameMap[T] {
    const element = aboutModalRuntime.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;

    return element;
}

/**
 * Enhanced escape key handler with better UX
 *
 * @param e - Keyboard event.
 */
export function handleEscapeKey(e: Event): void {
    if (aboutModalRuntime.isKeyboardEvent(e) && e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        hideAboutModal();
    }
}

/**
 * Enhanced modal display function with animations and improved accessibility
 */
export function showAboutModal(html = ""): void {
    ensureAboutModal();
    const modal = aboutModalRuntime.queryElement<HTMLElement>("#about-modal");
    if (modal) {
        if (hideTimer) {
            aboutModalRuntime.clearTimeout(hideTimer);
            hideTimer = null;
        }

        const body =
                aboutModalRuntime.queryElement<HTMLElement>(
                    "#about-modal-body"
                ),
            closeBtn =
                aboutModalRuntime.queryElement<HTMLElement>(
                    "#about-modal-close"
                ),
            copyBtn = aboutModalRuntime.queryElement<HTMLElement>(
                "#about-copy-system-info"
            );

        if (body && closeBtn) {
            // Set content
            body.replaceChildren();
            if (html) {
                body.append(sanitizeAboutBodyHtml(html));
            }

            // Save current focus
            lastFocusedElement = aboutModalRuntime.getActiveHTMLElement();

            // Show modal with animation
            modal.style.display = "flex";

            // Trigger animation on next frame
            if (showAnimationFrame !== null) {
                aboutModalRuntime.cancelAnimationFrame(showAnimationFrame);
            }
            showAnimationFrame = aboutModalRuntime.requestAnimationFrame(() => {
                showAnimationFrame = null;
                modal.classList.add("show");
            });

            // Set up event listeners
            cleanupAboutModalEventListeners();
            escapeKeyCleanup = addEventListenerWithCleanup(
                aboutModalRuntime.getDocumentEventTarget(),
                "keydown",
                handleEscapeKey,
                true
            );

            modalEventCleanups.push(
                addEventListenerWithCleanup(closeBtn, "click", (e) => {
                    e.preventDefault();
                    hideAboutModal();
                }),
                addEventListenerWithCleanup(closeBtn, "keydown", (e) => {
                    if (
                        aboutModalRuntime.isKeyboardEvent(e) &&
                        (e.key === "Enter" || e.key === " ")
                    ) {
                        e.preventDefault();
                        hideAboutModal();
                    }
                })
            );

            if (copyBtn) {
                const runCopy = async () => {
                    const text = buildSystemInfoClipboardText();
                    const ok =
                        await clipboardExportUtils.copyTextToClipboard?.(text);
                    if (ok) {
                        void showNotification(
                            "System info copied to clipboard",
                            "success",
                            2500
                        );
                        // Brief UX feedback on the button itself.
                        try {
                            const btnText =
                                copyBtn.querySelector<HTMLElement>(".btn-text");
                            if (btnText) {
                                const prev = btnText.textContent;
                                btnText.textContent = "Copied";
                                if (copyFeedbackTimer) {
                                    aboutModalRuntime.clearTimeout(
                                        copyFeedbackTimer
                                    );
                                }
                                copyFeedbackTimer =
                                    aboutModalRuntime.setTimeout(() => {
                                        copyFeedbackTimer = null;
                                        btnText.textContent = prev || "Copy";
                                    }, 1200);
                            }
                        } catch {
                            /* ignore */
                        }
                    } else {
                        void showNotification(
                            "Failed to copy system info",
                            "error",
                            3000
                        );
                    }
                };

                modalEventCleanups.push(
                    addEventListenerWithCleanup(copyBtn, "click", (e) => {
                        e.preventDefault();
                        void runCopy();
                    }),
                    addEventListenerWithCleanup(copyBtn, "keydown", (e) => {
                        if (
                            aboutModalRuntime.isKeyboardEvent(e) &&
                            (e.key === "Enter" || e.key === " ")
                        ) {
                            e.preventDefault();
                            void runCopy();
                        }
                    })
                );
            }
            // No toggle button: features + system info are displayed together.

            // Handle external links to open in user's default browser.
            // NOTE: The modal content container stops propagation to prevent backdrop-closing.
            // Attach handlers to .modal-content so delegated link clicks are still observed.
            const modalContentForLinks =
                modal.querySelector(".modal-content") ?? modal;

            // Close on backdrop click
            modalEventCleanups.push(
                attachExternalLinkHandlers({ root: modalContentForLinks }),
                addEventListenerWithCleanup(modal, "click", (e) => {
                    if (e.target === modal) {
                        hideAboutModal();
                    }
                })
            );

            // Prevent modal content clicks from closing modal
            const modalContent = modal.querySelector(".modal-content");
            if (modalContent) {
                modalEventCleanups.push(
                    addEventListenerWithCleanup(modalContent, "click", (e) => {
                        e.stopPropagation();
                    })
                );
            }

            // Focus management - focus close button after animation
            if (focusTimer) {
                aboutModalRuntime.clearTimeout(focusTimer);
            }
            focusTimer = aboutModalRuntime.setTimeout(() => {
                focusTimer = null;
                focusTrapCleanup?.();
                focusTrapCleanup = createModalFocusTrap(modal, closeBtn);
            }, modalAnimationDuration);

            // Load version information after modal is displayed
            try {
                void loadVersionInfo();
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
 */
function buildSystemInfoClipboardText(): string {
    try {
        const lines: string[] = ["Fit File Viewer – System Info"];

        const versionNumber = aboutModalRuntime.queryElement("#version-number");
        if (versionNumber && versionNumber.textContent) {
            lines.push(`App Version: ${versionNumber.textContent.trim()}`);
        }

        const items = aboutModalRuntime.queryElements(
            "#info-toggle-section .system-info-item"
        );

        for (const item of items) {
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
 * Enhanced modal hide function with smooth animations
 */
function hideAboutModal(): void {
    const modal = aboutModalRuntime.queryElement<HTMLElement>("#about-modal");
    if (modal) {
        focusTrapCleanup?.();
        focusTrapCleanup = null;
        if (focusTimer) {
            aboutModalRuntime.clearTimeout(focusTimer);
            focusTimer = null;
        }

        // Start closing animation
        modal.classList.remove("show");
        if (showAnimationFrame !== null) {
            aboutModalRuntime.cancelAnimationFrame(showAnimationFrame);
            showAnimationFrame = null;
        }

        // Wait for animation to complete before hiding
        if (hideTimer) {
            aboutModalRuntime.clearTimeout(hideTimer);
        }
        hideTimer = aboutModalRuntime.setTimeout(() => {
            hideTimer = null;
            modal.style.display = "none";

            // No toggle state to reset.

            // Restore focus to last focused element
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }

            // Clean up event listeners
            cleanupAboutModalEventListeners();
        }, modalAnimationDuration);
    }
}

function cleanupAboutModalEventListeners(): void {
    escapeKeyCleanup?.();
    escapeKeyCleanup = null;

    for (const cleanup of modalEventCleanups) {
        cleanup();
    }
    modalEventCleanups = [];
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
 */
function sanitizeAboutBodyHtml(html: string): DocumentFragment {
    const fragment = parseAboutBodyHtml(html);

    const blockedTags = new Set<string>([
        "EMBED",
        "IFRAME",
        "LINK",
        "META",
        "OBJECT",
        "SCRIPT",
    ]);

    const walker = aboutModalRuntime.createElementTreeWalker(fragment);
    const nodesToRemove: Element[] = [];

    while (walker.nextNode()) {
        const { currentNode } = walker;
        if (!aboutModalRuntime.isElement(currentNode)) {
            continue;
        }

        const el = currentNode;
        if (blockedTags.has(el.tagName)) {
            nodesToRemove.push(el);
            continue;
        }

        // Strip inline event handlers and dangerous URL-based attributes.
        for (let index = el.attributes.length - 1; index >= 0; index -= 1) {
            const attr = el.attributes.item(index);
            if (!attr) {
                continue;
            }

            const name = attr.name.toLowerCase();
            const value = String(attr.value);

            if (name.startsWith("on")) {
                el.removeAttribute(attr.name);
                continue;
            }

            if (name === "href" || name === "src") {
                const trimmed = value.trim();
                const lower = trimmed.toLowerCase();
                const isHttps = lower.startsWith("https://");
                const isMailto = lower.startsWith("mailto:");

                if (!isHttps && !isMailto) {
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

        // Force safe external links to be handled by the modal.
        if (aboutModalRuntime.isHTMLElement(el) && el.tagName === "A") {
            const href = el.getAttribute("href");
            if (
                href &&
                (href.startsWith("https://") || href.startsWith("mailto:"))
            ) {
                el.dataset["externalLink"] = "";
                el.setAttribute("rel", "noopener noreferrer");
            }
        }
    }

    for (const node of nodesToRemove) {
        node.remove();
    }

    return fragment;
}

/**
 * Parse the supplied body fragment before the allowlist cleanup runs.
 */
function parseAboutBodyHtml(html: string): DocumentFragment {
    const parsed = aboutModalRuntime.parseHtmlDocument(html);
    const fragment = aboutModalRuntime.createDocumentFragment();
    while (parsed.body.firstChild) {
        const child = parsed.body.firstChild;
        fragment.append(child);
    }

    return fragment;
}

/**
 * Development helpers for testing and debugging
 */
export const aboutModalDevHelpers = {
    /**
     * Show modal with sample content for testing
     */ /**
     * Reset all styles and recreate modal
     */
    reset: () => {
        const existingModal = aboutModalRuntime.queryElement("#about-modal"),
            existingStyles = aboutModalRuntime.queryElement(
                "#about-modal-styles"
            );

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
        const modal =
            aboutModalRuntime.queryElement<HTMLElement>("#about-modal");
        if (modal) {
            modal.style.transition = "all 1000ms ease";
            const modalContent =
                modal.querySelector<HTMLElement>(".modal-content");
            if (modalContent) {
                modalContent.style.transition =
                    "transform 1000ms cubic-bezier(0.34, 1.56, 0.64, 1)";
            }
        }
        aboutModalDevHelpers.showSample();
    },
};

// Initialize modal styles when module loads
const aboutModalDocument = aboutModalRuntime.getDocument();
if (aboutModalDocument?.readyState === "loading") {
    addEventListenerWithCleanup(aboutModalDocument, "DOMContentLoaded", () => {
        // Pre-initialize styles for better performance
        injectModalStyles();
    });
} else if (aboutModalDocument) {
    // Document already loaded, initialize immediately
    injectModalStyles();
}
