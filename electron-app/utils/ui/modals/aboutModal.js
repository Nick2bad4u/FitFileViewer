/**
 * Enhanced About Modal Dialog Utility
 * Provides modern design and animations with dynamic version l								<span class="system-info-value node-highlight">${CONSTANTS.DEFAULT_VALUES.NODE}</span>ading
 */

import { ensureAboutModal } from "./ensureAboutModal.js";
import { injectModalStyles } from "./injectModalStyles.js";
import { loadVersionInfo } from "../../app/initialization/loadVersionInfo.js";

// Constants for better maintainability
const CONSTANTS = {
    MODAL_ANIMATION_DURATION: 300,
    DEFAULT_VALUES: {
        VERSION: "Loading...",
        ELECTRON: "Loading...",
        NODE: "Loading...",
        CHROME: "Loading...",
        PLATFORM: "Loading...",
        AUTHOR: "Nick2bad4u",
        LICENSE: "Unlicense",
    },
    LOG_PREFIX: "[AboutModal]",
};

// Module state
let lastFocusedElement = null;
export let modalAnimationDuration = CONSTANTS.MODAL_ANIMATION_DURATION;
let showingFeatures = false; // Track whether features or system info is currently displayed

/**
 * Creates the enhanced modal content with modern styling and branding
 * Uses dynamic loading values that will be replaced by loadVersionInfo()
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
				</div>				<div class="modal-body">					<h1 class="modal-title">
						<span class="title-gradient">Fit File Viewer</span>
						<span class="version-badge">
							<span class="version-prefix">v</span>
							<span class="version-number" id="version-number">${CONSTANTS.DEFAULT_VALUES.VERSION}</span>
						</span>
					</h1>
					<p class="modal-subtitle">Advanced FIT file analysis and visualization tool</p>
					
					<div class="modal-actions">
						<button id="toggle-info-btn" class="features-btn" tabindex="0" aria-label="Toggle between features and system info">
							<span class="btn-icon">✨</span>
							<span class="btn-text">Features</span>
						</button>
					</div>
					
					<div class="feature-highlights">
						<div class="feature-item">
							<div class="feature-icon">📊</div>
							<span>Data Analysis</span>
						</div>
						<div class="feature-item">
							<div class="feature-icon">🗺️</div>
							<span>GPS Mapping</span>
						</div>
						<div class="feature-item">
							<div class="feature-icon">📈</div>
							<span>Performance Metrics</span>
						</div>
					</div>

					<div id="info-toggle-section" class="system-info-section">
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
								<span class="system-info-value node-highlight">22.15.1</span>
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
 * Toggles between features and system info display
 */
function toggleInfoSection() {
    const toggleSection = document.getElementById("info-toggle-section");
    const toggleButton = document.getElementById("toggle-info-btn");
    const buttonIcon = toggleButton?.querySelector(".btn-icon");
    const buttonText = toggleButton?.querySelector(".btn-text");

    if (!toggleSection || !toggleButton) return;

    showingFeatures = !showingFeatures;

    // Add transition effect
    toggleSection.style.opacity = "0.5";

    setTimeout(function () {
        if (showingFeatures) {
            // Show features
            toggleSection.innerHTML = createFeaturesContent();
            buttonIcon.textContent = "🔧";
            buttonText.textContent = "System Info";
            toggleButton.setAttribute("aria-label", "View system information");
        } else {
            // Show system info
            toggleSection.innerHTML = createSystemInfoContent();
            buttonIcon.textContent = "✨";
            buttonText.textContent = "Features";
            toggleButton.setAttribute("aria-label", "View detailed features");

            // Reload system info data after switching back
            try {
                loadVersionInfo();
            } catch (error) {
                console.warn(`${CONSTANTS.LOG_PREFIX} Failed to reload version info:`, error);
            }
        }

        // Restore opacity
        toggleSection.style.opacity = "1";
    }, 150);
}

/**
 * Enhanced modal hide function with smooth animations
 */
function hideAboutModal() {
    const modal = document.getElementById("about-modal");
    if (modal) {
        // Start closing animation
        modal.classList.remove("show");

        // Wait for animation to complete before hiding
        setTimeout(function () {
            modal.style.display = "none";

            // Reset to system info state when closing
            showingFeatures = false;
            const toggleSection = document.getElementById("info-toggle-section");
            const toggleButton = document.getElementById("toggle-info-btn");
            if (toggleSection && toggleButton) {
                toggleSection.innerHTML = createSystemInfoContent();
                const buttonIcon = toggleButton.querySelector(".btn-icon");
                const buttonText = toggleButton.querySelector(".btn-text");
                if (buttonIcon) buttonIcon.textContent = "✨";
                if (buttonText) buttonText.textContent = "Features";
                toggleButton.setAttribute("aria-label", "View detailed features");
                // Reload system info
                try {
                    loadVersionInfo();
                } catch (error) {
                    console.warn(`${CONSTANTS.LOG_PREFIX} Failed to reload version info:`, error);
                }
            }

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
 * Enhanced escape key handler with better UX
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
 * @param {string} html - HTML content to display in the modal body
 */
export function showAboutModal(html = "") {
    ensureAboutModal();
    const modal = document.getElementById("about-modal");
    if (modal) {
        const body = document.getElementById("about-modal-body");
        const closeBtn = document.getElementById("about-modal-close");
        const toggleBtn = document.getElementById("toggle-info-btn");

        if (body && closeBtn) {
            // Set content
            body.innerHTML = html;

            // Save current focus
            lastFocusedElement = document.activeElement;

            // Show modal with animation
            modal.style.display = "flex";

            // Trigger animation on next frame
            requestAnimationFrame(() => {
                modal.classList.add("show");
            });

            // Set up event listeners
            closeBtn.onclick = (e) => {
                e.preventDefault();
                hideAboutModal();
            };

            closeBtn.onkeydown = (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    hideAboutModal();
                }
            };
            // Toggle button functionality
            if (toggleBtn) {
                toggleBtn.onclick = (e) => {
                    e.preventDefault();
                    toggleInfoSection();
                };

                toggleBtn.onkeydown = (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleInfoSection();
                    }
                };
            }

            // Handle external links to open in user's default browser
            const externalLinks = modal.querySelectorAll("[data-external-link]");
            externalLinks.forEach((link) => {
                link.onclick = (e) => {
                    e.preventDefault();
                    const url = link.getAttribute("href");
                    if (url && window.electronAPI && window.electronAPI.openExternal) {
                        window.electronAPI.openExternal(url);
                    } else if (url) {
                        // Fallback for non-Electron environments
                        window.open(url, "_blank", "noopener,noreferrer");
                    }
                };

                link.onkeydown = (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        const url = link.getAttribute("href");
                        if (url && window.electronAPI && window.electronAPI.openExternal) {
                            window.electronAPI.openExternal(url);
                        } else if (url) {
                            // Fallback for non-Electron environments
                            window.open(url, "_blank", "noopener,noreferrer");
                        }
                    }
                };
            });

            // Close on backdrop click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    hideAboutModal();
                }
            };

            // Prevent modal content clicks from closing modal
            const modalContent = modal.querySelector(".modal-content");
            if (modalContent) {
                modalContent.onclick = (e) => {
                    e.stopPropagation();
                };
            }

            // Focus management - focus close button after animation
            setTimeout(function () {
                closeBtn.focus();
            }, modalAnimationDuration);

            // Load version information after modal is displayed
            try {
                loadVersionInfo();
            } catch (error) {
                console.warn(`${CONSTANTS.LOG_PREFIX} Failed to load version info on modal show:`, error);
            }
            // Sound functionality removed as requested
        }
    }
}

/**
 * Development helpers for testing and debugging
 */
const devHelpers = {
    /**
     * Show modal with sample content for testing
     */ showSample: () => {
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
        const modal = document.getElementById("about-modal");
        if (modal) {
            modal.style.transition = "all 1000ms ease";
            modal.querySelector(".modal-content").style.transition =
                "transform 1000ms cubic-bezier(0.34, 1.56, 0.64, 1)";
        }
        devHelpers.showSample();
    },

    /**
     * Reset all styles and recreate modal
     */
    reset: () => {
        const existingModal = document.getElementById("about-modal");
        const existingStyles = document.getElementById("about-modal-styles");

        if (existingModal) existingModal.remove();
        if (existingStyles) existingStyles.remove();

        ensureAboutModal();
    },
};

// Export development helpers in development mode
if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development") {
    window.aboutModalDevHelpers = devHelpers;
}

// Initialize modal styles when module loads
if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        // Pre-initialize styles for better performance
        injectModalStyles();
    });
} else if (typeof document !== "undefined") {
    // Document already loaded, initialize immediately
    injectModalStyles();
}
