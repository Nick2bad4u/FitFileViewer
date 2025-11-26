/**
 * Modern Enhancements Module
 *
 * This module provides client-side enhancements for the documentation site.
 * It runs after the initial page load to add interactive features and improve UX.
 *
 * @module modernEnhancements
 */

import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";

/**
 * Adds smooth scrolling to anchor links
 */
function addSmoothScrolling(): void {
    if (!ExecutionEnvironment.canUseDOM) {
        return;
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function handleClick(this: HTMLAnchorElement, event: Event) {
            const href = this.getAttribute("href");
            if (href && href !== "#") {
                const target = document.querySelector(href);
                if (target) {
                    event.preventDefault();
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            }
        });
    });
}

/**
 * Adds external link indicators and security attributes
 */
function enhanceExternalLinks(): void {
    if (!ExecutionEnvironment.canUseDOM) {
        return;
    }

    const externalLinks = document.querySelectorAll<HTMLAnchorElement>(
        'a[href^="http"]:not([href*="' + window.location.hostname + '"])'
    );

    externalLinks.forEach((link) => {
        // Add security attributes
        link.setAttribute("rel", "noopener noreferrer");
        link.setAttribute("target", "_blank");

        // Add visual indicator if not already present
        if (!link.querySelector(".external-link-icon") && !link.classList.contains("no-external-icon")) {
            const icon = document.createElement("span");
            icon.className = "external-link-icon";
            icon.textContent = " ↗";
            icon.style.fontSize = "0.75em";
            icon.style.verticalAlign = "super";
            link.appendChild(icon);
        }
    });
}

/**
 * Adds copy functionality to code blocks
 */
function enhanceCodeBlocks(): void {
    if (!ExecutionEnvironment.canUseDOM) {
        return;
    }

    // Docusaurus already handles this, but we can add custom enhancements
    const codeBlocks = document.querySelectorAll("pre > code");

    codeBlocks.forEach((codeBlock) => {
        const pre = codeBlock.parentElement;
        if (pre && !pre.dataset.enhanced) {
            pre.dataset.enhanced = "true";

            // Add language label if detectable
            const classes = codeBlock.className.split(" ");
            const langClass = classes.find((c) => c.startsWith("language-"));
            if (langClass) {
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
                pre.appendChild(label);
            }
        }
    });
}

/**
 * Adds scroll reveal animations
 */
function addScrollRevealAnimations(): void {
    if (!ExecutionEnvironment.canUseDOM) {
        return;
    }

    const observerOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Support both global classes (e.g. .scroll-reveal) and CSS-module classes
    // (e.g. .scrollRevealLeft_xxx) by matching on the class name substring.
    const scrollRevealSelector =
        ".scroll-reveal, [class*=\"scrollReveal\"]";

    document.querySelectorAll(scrollRevealSelector).forEach((el) => {
        observer.observe(el);
    });
}

/**
 * Hides the copy-page button on the homepage while keeping it visible on docs pages.
 */
function toggleCopyPageButtonVisibility(): void {
    if (!ExecutionEnvironment.canUseDOM) {
        return;
    }

    const isHome = window.location.pathname === "/";
    const container = document.querySelector<HTMLElement>(".copy-page-button__container");

    if (container) {
        // Hide on home, reset on other pages
        container.style.display = isHome ? "none" : "";
    }
}

/**
 * Initialize all enhancements
 */
function initEnhancements(): void {
    if (!ExecutionEnvironment.canUseDOM) {
        return;
    }

    // Run on initial load
    addSmoothScrolling();
    enhanceExternalLinks();
    enhanceCodeBlocks();
    addScrollRevealAnimations();
    toggleCopyPageButtonVisibility();

    // Re-run on route changes (for SPA navigation)
    if (typeof window !== "undefined") {
        // Use MutationObserver to detect content changes
        const mainContent = document.querySelector("main");
        if (mainContent) {
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
}

// Initialize when DOM is ready
if (ExecutionEnvironment.canUseDOM) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initEnhancements);
    } else {
        initEnhancements();
    }
}

export default initEnhancements;
