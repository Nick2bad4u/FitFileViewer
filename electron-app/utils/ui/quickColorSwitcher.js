/**
 * @fileoverview Quick Accent Color Switcher
 * @description A sleek floating button for instant accent color switching
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

import { getEffectiveAccentColor, setAccentColor } from "../theming/core/accentColor.js";
import { getEffectiveTheme, loadTheme, THEME_MODES } from "../theming/core/theme.js";

/**
 * Preset color palettes with witty names
 * @private
 */
const COLOR_PRESETS = [
	{ color: "#3b82f6", name: "Blue-tiful" },
	{ color: "#8b5cf6", name: "Purple Rain" },
	{ color: "#ec4899", name: "Pink Panther" },
	{ color: "#10b981", name: "Green Machine" },
	{ color: "#f59e0b", name: "Golden Hour" },
	{ color: "#ef4444", name: "Red Hot" },
	{ color: "#06b6d4", name: "Cyan-tific" },
	{ color: "#f97316", name: "Orange Crush" },
];

const THEME_OPTIONS = [
	{ icon: "mdi:weather-sunny", label: "Light", mode: THEME_MODES.LIGHT },
	{ icon: "mdi:moon-waning-crescent", label: "Dark", mode: THEME_MODES.DARK },
	{ icon: "mdi:theme-light-dark", label: "Auto", mode: THEME_MODES.AUTO },
];

/**
 * ID for the color switcher element
 * @private
 */
const SWITCHER_ID = "quick-color-switcher";

/**
 * Initializes the quick color switcher
 */
export function initQuickColorSwitcher() {
	// Check if already initialized
	if (document.getElementById(SWITCHER_ID)) {
		return;
	}

	// Create and inject the switcher
	const switcher = createSwitcherElement();
	document.body.append(switcher);

	// Inject styles
	injectSwitcherStyles();

	// Setup event listeners
	setupSwitcherListeners(switcher);
}

/**
 * Updates the active color in the switcher
 * @param {string} color - The new active color
 */
export function updateSwitcherActiveColor(color) {
	const switcher = document.getElementById(SWITCHER_ID);
	if (!switcher) return;

	const colorOptions = switcher.querySelectorAll(".color-option");
	for (const option of colorOptions) {
		option.classList.toggle("active", option.dataset.color === color);
	}
}

/**
 * Creates the switcher DOM element
 * @returns {HTMLElement} The switcher element
 * @private
 */
function createSwitcherElement() {
	const switcher = document.createElement("div");
	switcher.id = SWITCHER_ID;
	switcher.className = "quick-color-switcher";

	const currentTheme = loadTheme();
	const effectiveTheme = getEffectiveTheme(currentTheme);
	const currentColor = getEffectiveAccentColor(effectiveTheme);

	switcher.innerHTML = `
		<button class="switcher-toggle" id="color-switcher-toggle" data-tooltip="Quick Colors" aria-label="Open color switcher">
			<iconify-icon icon="unjs:theme-colors" width="24" height="24" style="vertical-align: middle;"></iconify-icon>
			<span class="switcher-label">Colors</span>
		</button>
		<div class="switcher-dropdown" id="color-switcher-dropdown">
			<div class="switcher-header">
				<span class="witty-title">🎨 Pick Your Vibe</span>
			</div>
			<div class="theme-toggle-group" role="group" aria-label="Theme selection">
				${THEME_OPTIONS.map(
		(option) => `
					<button class="theme-toggle-btn${currentTheme === option.mode ? " active" : ""}" data-theme="${option.mode}" type="button">
						<iconify-icon icon="${option.icon}" width="16" height="16"></iconify-icon>
						<span>${option.label}</span>
					</button>
				`
	).join("")}
			</div>
			<div class="color-grid">
				${COLOR_PRESETS.map(
		(preset) => `
					<button
						class="color-option ${preset.color === currentColor ? "active" : ""}"
						data-color="${preset.color}"
						title="${preset.name}"
						style="background: ${preset.color};"
						aria-label="Switch to ${preset.name}"
					>
						<span class="color-name">${preset.name}</span>
						<span class="color-check">✓</span>
					</button>
				`,
	).join("")}
			</div>
			<div class="switcher-footer">
				<button class="open-settings-btn" id="open-full-settings" title="Advanced color settings">
					<iconify-icon icon="flat-color-icons:settings" width="16" height="16"></iconify-icon>
					More Options
				</button>
			</div>
		</div>
	`;

	return switcher;
}

/**
 * Injects CSS styles for the switcher
 * @private
 */
function injectSwitcherStyles() {
	if (document.getElementById("quick-color-switcher-styles")) {
		return;
	}

	const style = document.createElement("style");
	style.id = "quick-color-switcher-styles";
	style.textContent = `
	.quick-color-switcher {
		position: static;
		top: 20px;
		right: 20px;
		z-index: 999;
		font-family: var(--font-sans);
	}		.switcher-toggle {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 16px;
			background: var(--color-bg-alt-solid);
			border: 1px solid var(--color-border);
			border-radius: 24px;
			color: var(--color-fg);
			cursor: pointer;
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
			backdrop-filter: blur(10px);
		}

	.switcher-toggle:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: var(--color-accent);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
		transform: scale(1.08);
	}

	.switcher-toggle:active {
		transform: scale(0.98);
	}

	.switcher-icon {
		width: 16px;
		height: 16px;
		color: var(--color-accent);
		flex-shrink: 0;
	}

	.switcher-label {
		display: none;
	}	.switcher-dropdown {
		position: absolute;
		top: calc(100% + 12px);
		right: 0;
		width: 320px;
		background: var(--color-bg-alt-solid);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
		opacity: 0;
		visibility: hidden;
		transform: translateY(-10px);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		backdrop-filter: blur(10px);
		z-index: 100;
	}		.switcher-dropdown.open {
			opacity: 1;
			visibility: visible;
			transform: translateY(0);
		}

		.switcher-header {
			padding: 16px;
			border-bottom: 1px solid var(--color-border);
		}

		.witty-title {
			font-size: 1.1rem;
			font-weight: 700;
			background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}

		.theme-toggle-group {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
			gap: 8px;
			padding: 16px;
			border-bottom: 1px solid var(--color-border);
		}

		.theme-toggle-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			padding: 8px 10px;
			border-radius: var(--border-radius-small);
			background: var(--color-glass);
			border: 1px solid var(--color-border);
			color: var(--color-fg);
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: var(--transition-smooth);
		}

		.theme-toggle-btn iconify-icon {
			color: currentColor;
		}

		.theme-toggle-btn:hover,
		.theme-toggle-btn:focus-visible {
			border-color: var(--color-accent);
			color: var(--color-accent);
			outline: none;
			box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
		}

		.theme-toggle-btn.active {
			background: rgb(var(--color-accent-rgb) / 16%);
			border-color: var(--color-accent);
			color: var(--color-accent);
		}

		.color-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
			padding: 16px;
		}

		.color-option {
			position: relative;
			padding: 16px 12px;
			border: 2px solid transparent;
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.color-option::before {
			content: '';
			position: absolute;
			inset: 0;
			background: inherit;
			opacity: 0.9;
			transition: opacity 0.2s;
		}

		.color-option:hover::before {
			opacity: 1;
		}

		.color-option:hover {
			border-color: var(--color-fg);
			transform: scale(1.05);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		}

		.color-option:active {
			transform: scale(0.98);
		}

		.color-option.active {
			border-color: var(--color-fg);
			box-shadow: 0 0 0 3px var(--color-accent-hover);
		}

		.color-name {
			position: relative;
			z-index: 1;
			font-size: 0.85rem;
			font-weight: 600;
			color: white;
			text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		}

		.color-check {
			position: absolute;
			top: 6px;
			right: 6px;
			font-size: 14px;
			opacity: 0;
			color: white;
			transform: scale(0.5);
			transition: all 0.2s;
			z-index: 1;
			text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
		}

		.color-option.active .color-check {
			opacity: 1;
			transform: scale(1);
		}

		.switcher-footer {
			padding: 12px 16px;
			border-top: 1px solid var(--color-border);
		}

		.open-settings-btn {
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 8px 12px;
			background: var(--color-glass);
			border: 1px solid var(--color-border);
			border-radius: 6px;
			color: var(--color-fg);
			font-size: 0.85rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}

		.open-settings-btn:hover {
			background: var(--color-accent-hover);
			border-color: var(--color-accent);
			color: var(--color-accent);
		}

		.open-settings-btn svg {
			color: var(--color-accent);
		}

		/* Mobile responsive */
		@media (max-width: 768px) {
			.quick-color-switcher {
				top: 10px;
				right: 10px;
			}

			.switcher-toggle {
				padding: 8px 12px;
			}

			.switcher-label {
				font-size: 0.85rem;
			}

			.theme-toggle-group {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}

			.switcher-dropdown {
				width: 280px;
			}

			.color-grid {
				grid-template-columns: repeat(2, 1fr);
				gap: 8px;
			}
		}
	`;

	document.head.append(style);
}

/**
 * Sets up event listeners for the switcher
 * @param {HTMLElement} switcher - The switcher element
 * @private
 */
async function setupSwitcherListeners(switcher) {
	const toggle = switcher.querySelector("#color-switcher-toggle");
	const dropdown = switcher.querySelector("#color-switcher-dropdown");
	const colorOptions = switcher.querySelectorAll(".color-option");
	const settingsBtn = switcher.querySelector("#open-full-settings");
	const themeButtons = switcher.querySelectorAll(".theme-toggle-btn");

	const updateThemeButtonState = (/** @type {string} */ activeTheme) => {
		for (const button of themeButtons) {
			button.classList.toggle("active", button.dataset.theme === activeTheme);
		}
	};

	const handleThemeChange = () => {
		updateThemeButtonState(loadTheme());
	};

	if (themeButtons.length > 0) {
		updateThemeButtonState(loadTheme());
		document.body.addEventListener("themechange", handleThemeChange);
		window.addEventListener("beforeunload", () => {
			document.body.removeEventListener("themechange", handleThemeChange);
		});
	}

	// Toggle dropdown
	toggle?.addEventListener("click", (e) => {
		e.stopPropagation();
		dropdown?.classList.toggle("open");
	});

	// Close dropdown when clicking outside
	document.addEventListener("click", (e) => {
		if (!switcher.contains(e.target)) {
			dropdown?.classList.remove("open");
		}
	});

	for (const button of themeButtons) {
		button.addEventListener("click", async () => {
			const themeMode = button.dataset.theme;
			if (!themeMode) {
				return;
			}

			// Use AppActions.switchTheme (same as menu) for consistent behavior
			try {
				const { AppActions } = await import("../app/lifecycle/appActions.js");
				AppActions.switchTheme(themeMode);
				console.log(`[Quick Color Switcher] Theme switched to: ${themeMode}`);
			} catch (error) {
				console.error("[Quick Color Switcher] Failed to switch theme:", error);
			} updateThemeButtonState(themeMode);
			setTimeout(() => {
				dropdown?.classList.remove("open");
			}, 220);
		});
	}

	// Color option click
	for (const option of colorOptions) {
		option.addEventListener("click", () => {
			const { color } = option.dataset;
			if (color) {
				const currentTheme = loadTheme();
				const effectiveTheme = getEffectiveTheme(currentTheme);
				setAccentColor(color, effectiveTheme);

				// Update active state
				for (const opt of colorOptions) {
					opt.classList.remove("active");
				}
				option.classList.add("active");

				// Close dropdown after short delay
				setTimeout(() => {
					dropdown?.classList.remove("open");
				}, 500);
			}
		});
	}

	// Open full settings modal
	settingsBtn?.addEventListener("click", async () => {
		dropdown?.classList.remove("open");
		const { showSettingsModal } = await import("./settingsModal.js");
		showSettingsModal();
	});

	// Notify UIStateManager to re-attach event listeners if it exists
	try {
		const { uiStateManager } = await import("../state/domain/uiStateManager.js");
		if (uiStateManager && typeof uiStateManager.setupEventListeners === "function") {
			uiStateManager.setupEventListeners();
			console.log("[Quick Color Switcher] Event listeners re-attached");
		}
	} catch {
		// UIStateManager might not be loaded yet, that's okay
		console.log("[Quick Color Switcher] UIStateManager not available, event listeners will attach on next state change");
	}
}
