/**
 * Modern Enhancements Module
 *
 * This module provides client-side enhancements for the documentation site. It
 * runs after the initial page load to add interactive features and improve UX.
 *
 * @packageDocumentation
 */

const enhancementAbortController = new AbortController();

/**
 * Adds scroll reveal animations
 */
function addScrollRevealAnimations(): void {
    if (!canUseDOM()) {
        return;
    }

    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        }
    }, observerOptions);

    // Support both global classes (e.g. .scroll-reveal) and CSS-module classes
    // (e.g. .scrollRevealLeft_xxx) by matching on the class name substring.
    const scrollRevealSelector = '.scroll-reveal, [class*="scrollReveal"]';

    for (const el of document.querySelectorAll(scrollRevealSelector)) {
        observer.observe(el);
    }
}

/**
 * Adds smooth scrolling to anchor links
 */
function addSmoothScrolling(): void {
    if (!canUseDOM()) {
        return;
    }

    for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
        'a[href^="#"]'
    )) {
        anchor.removeEventListener("click", handleAnchorClick);
        anchor.addEventListener("click", handleAnchorClick, {
            signal: enhancementAbortController.signal,
        });
    }
}

function canUseDOM(): boolean {
    return typeof document !== "undefined";
}

/**
 * Adds copy functionality to code blocks
 */
function enhanceCodeBlocks(): void {
    if (!canUseDOM()) {
        return;
    }

    // Docusaurus already handles this, but we can add custom enhancements
    const codeBlocks = document.querySelectorAll("pre > code");

    for (const codeBlock of codeBlocks) {
        const pre = codeBlock.parentElement;
        if (pre !== null && pre.dataset.enhanced !== "true") {
            pre.dataset.enhanced = "true";

            // Add language label if detectable
            const classes = codeBlock.className.split(" ");
            const langClass = classes.find((c) => c.startsWith("language-"));
            if (langClass !== undefined) {
                const lang = langClass.replace("language-", "");
                const label = document.createElement("span");
                label.className = "code-language-label";
                label.textContent = lang.toUpperCase();
                label.style.cssText = `
                    position: absolute;
                    top: 0;
                    right: 0;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.65rem;
                    background: var(--ifm-color-emphasis-200);
                    border-radius: 0 0.25rem 0 0.25rem;
                    opacity: 0.7;
                    pointer-events: none;
                `;
                pre.style.position = "relative";
                pre.append(label);
            }
        }
    }
}

/**
 * Adds external link indicators and security attributes
 */
function enhanceExternalLinks(): void {
    if (!canUseDOM()) {
        return;
    }

    const externalLinks = document.querySelectorAll<HTMLAnchorElement>(
        `a[href^="http"]:not([href*="${globalThis.location.hostname}"])`
    );

    for (const link of externalLinks) {
        // Add security attributes
        link.setAttribute("rel", "noopener noreferrer");
        link.setAttribute("target", "_blank");

        // Add visual indicator if not already present
        if (
            !link.querySelector(".external-link-icon") &&
            !link.classList.contains("no-external-icon")
        ) {
            const icon = document.createElement("span");
            icon.className = "external-link-icon";
            icon.textContent = " ↗";
            icon.style.fontSize = "0.75em";
            icon.style.verticalAlign = "super";
            link.append(icon);
        }
    }
}

function handleAnchorClick(event: Readonly<Event>): void {
    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLAnchorElement)) {
        return;
    }

    const href = anchor.getAttribute("href");
    if (href === null || href === "" || href === "#") {
        return;
    }

    const target = document.querySelector(href);
    if (target === null) {
        return;
    }

    event.preventDefault();
    target.scrollIntoView({
        behavior: "smooth",
        block: "start",
    });
}

/**
 * Initialize all enhancements
 */
function initEnhancements(): void {
    if (!canUseDOM()) {
        return;
    }

    document.removeEventListener("DOMContentLoaded", initEnhancements);

    // Run on initial load
    addSmoothScrolling();
    enhanceExternalLinks();
    enhanceCodeBlocks();
    addScrollRevealAnimations();
    toggleCopyPageButtonVisibility();

    // Use MutationObserver to detect content changes during SPA navigation.
    const mainContent = document.querySelector("main");
    if (mainContent !== null) {
        const mutationObserver = new MutationObserver(() => {
            enhanceExternalLinks();
            enhanceCodeBlocks();
            addScrollRevealAnimations();
            toggleCopyPageButtonVisibility();
        });

        mutationObserver.observe(mainContent, {
            childList: true,
            subtree: true,
        });
    }
}

/**
 * Hides the copy-page button on the homepage while keeping it visible on docs
 * pages.
 */
function toggleCopyPageButtonVisibility(): void {
    if (!canUseDOM()) {
        return;
    }

    const isHome = globalThis.location.pathname === "/";
    const container = document.querySelector<HTMLElement>(
        ".copy-page-button__container"
    );

    if (container !== null) {
        // Hide on home, reset on other pages
        container.style.display = isHome ? "none" : "";
    }
}

// Initialize when DOM is ready
if (canUseDOM()) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initEnhancements, {
            once: true,
            signal: enhancementAbortController.signal,
        });
    } else {
        initEnhancements();
    }
}

export default initEnhancements;
