/**
 * @fileoverview Settings Modal
 * @description Provides a settings UI for theme and accent color customization
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

import {
	getEffectiveAccentColor,
	isValidHexColor,
	resetAccentColor,
	setAccentColor,
} from "../theming/core/accentColor.js";
import { getEffectiveTheme, loadTheme, setThemePreference, THEME_MODES } from "../theming/core/theme.js";
import { addEventListenerWithCleanup } from "./events/eventListenerManager.js";

/**
 * Modal ID for the settings modal
 */
const SETTINGS_MODAL_ID = "settings-modal";

/**
 * Animation duration for modal transitions
 */
const ANIMATION_DURATION = 300;

// ============================================================================
// Public API (Exported Functions)
// ============================================================================

/**
 * Closes the settings modal
 */
export function closeSettingsModal() {
	const modal = document.getElementById(SETTINGS_MODAL_ID);
	if (modal) {
		modal.classList.remove("show");
		setTimeout(() => {
			modal.style.display = "none";
		}, ANIMATION_DURATION);
	}
}

/**
 * Shows the settings modal
 */
export async function showSettingsModal() {
	let modal = document.getElementById(SETTINGS_MODAL_ID);

	// Create modal if it doesn't exist
	if (!modal) {
		modal = document.createElement("div");
		modal.id = SETTINGS_MODAL_ID;
		modal.className = "modal fancy-modal";
		modal.style.display = "none";
		document.body.append(modal);

		// Inject styles (from aboutModal styles)
		const { injectModalStyles } = await import("./modals/injectModalStyles.js");
		injectModalStyles();
	}

	// Inject settings-specific styles
	injectSettingsModalStyles();

	// Get current theme and accent color
	const currentTheme = loadTheme();
	const effectiveTheme = getEffectiveTheme(currentTheme);
	const currentAccent = getEffectiveAccentColor(effectiveTheme);

	// Set modal content
	modal.innerHTML = createSettingsModalContent(currentTheme, currentAccent);

	// Show modal with animation
	modal.style.display = "flex";
	requestAnimationFrame(() => {
		modal.classList.add("show");
	});

	// Setup event handlers
	setupSettingsModalHandlers(modal, effectiveTheme);
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Creates the settings modal HTML content
 * @param {string} currentTheme - Current theme mode
 * @param {string} currentAccent - Current accent color
 * @returns {string} HTML content
 */
function createSettingsModalContent(currentTheme, currentAccent) {
	return `
		<div class="modal-backdrop">
			<div class="modal-content" style="max-width: 600px;">
				<div class="modal-header">
					<div class="modal-icon">
						<iconify-icon icon="flat-color-icons:settings" width="32" height="32"></iconify-icon>
					</div>
					<button id="settings-modal-close" class="modal-close" tabindex="0" aria-label="Close settings">
						<iconify-icon icon="twemoji:cross-mark" width="24" height="24"></iconify-icon>
					</button>
				</div>
				<div class="modal-body">
					<h2 class="modal-title">Settings</h2>
					<p class="modal-subtitle">Customize your FitFileViewer experience</p>

					<div class="settings-section">
						<h3 class="settings-section-title">🎨 Appearance</h3>

						<!-- Theme Selection -->
						<div class="setting-item">
							<label for="theme-select" class="setting-label">Theme</label>
							<select id="theme-select" class="setting-select">
								<option value="${THEME_MODES.AUTO}" ${currentTheme === THEME_MODES.AUTO ? "selected" : ""}>Auto (Follow System)</option>
								<option value="${THEME_MODES.DARK}" ${currentTheme === THEME_MODES.DARK ? "selected" : ""}>Dark</option>
								<option value="${THEME_MODES.LIGHT}" ${currentTheme === THEME_MODES.LIGHT ? "selected" : ""}>Light</option>
							</select>
						</div>

						<!-- Max Recent Files -->
						<div class="setting-item">
							<label for="max-recent-files" class="setting-label">Maximum Recent Files</label>
							<select id="max-recent-files" class="setting-select">
								<option value="5" ${(localStorage.getItem('maxRecentFiles') || '10') === '5' ? 'selected' : ''}>5 files</option>
								<option value="10" ${(localStorage.getItem('maxRecentFiles') || '10') === '10' ? 'selected' : ''}>10 files</option>
								<option value="15" ${(localStorage.getItem('maxRecentFiles') || '10') === '15' ? 'selected' : ''}>15 files</option>
								<option value="20" ${(localStorage.getItem('maxRecentFiles') || '10') === '20' ? 'selected' : ''}>20 files</option>
								<option value="25" ${(localStorage.getItem('maxRecentFiles') || '10') === '25' ? 'selected' : ''}>25 files</option>
							</select>
							<p style="font-size: 0.85rem; color: var(--color-fg-muted); margin-top: 4px;">Number of recent files to show in right-click menu</p>
						</div>

						<!-- Accent Color Picker -->
						<div class="setting-item">
							<label for="accent-color-picker" class="setting-label">Accent Color</label>
							<div class="accent-color-controls">
								<input
									type="color"
									id="accent-color-picker"
									class="accent-color-input"
									value="${currentAccent}"
									title="Choose accent color"
								/>
								<input
									type="text"
									id="accent-color-text"
									class="accent-color-text-input"
									value="${currentAccent}"
									pattern="^#[0-9A-Fa-f]{6}$"
									placeholder="#3b82f6"
									maxlength="7"
								/>
							<button id="reset-accent-color" class="reset-btn" title="Reset to default">
								<iconify-icon icon="flat-color-icons:undo" width="18" height="18"></iconify-icon>
							</button>
							</div>
							<div class="accent-color-preview">
								<div class="preview-label">Preview:</div>
								<div class="preview-samples">
									<button class="preview-button">Button</button>
									<div class="preview-chip">Chip</div>
									<div class="preview-badge">Badge</div>
								</div>
							</div>
						</div>
					</div>

					<div class="settings-footer">
						<button id="settings-close-btn" class="themed-btn">Close</button>
					</div>
				</div>
			</div>
		</div>
	`;
}

/**
 * Injects CSS styles for the settings modal
 */
function injectSettingsModalStyles() {
	if (document.querySelector("#settings-modal-styles")) {
		return;
	}

	const style = document.createElement("style");
	style.id = "settings-modal-styles";
	style.textContent = `
		#${SETTINGS_MODAL_ID} .settings-section {
			margin: 24px 0;
			padding: 20px;
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: var(--border-radius-small);
		}

		#${SETTINGS_MODAL_ID} .settings-section-title {
			margin: 0 0 16px 0;
			font-size: 1.2rem;
			font-weight: 600;
			color: var(--color-fg);
		}

		#${SETTINGS_MODAL_ID} .setting-item {
			margin-bottom: 20px;
		}

		#${SETTINGS_MODAL_ID} .setting-item:last-child {
			margin-bottom: 0;
		}

		#${SETTINGS_MODAL_ID} .setting-label {
			display: block;
			margin-bottom: 8px;
			font-weight: 500;
			color: var(--color-fg);
			font-size: 0.95rem;
		}

		#${SETTINGS_MODAL_ID} .setting-select {
			width: 100%;
			padding: 10px 12px;
			background: var(--color-bg-alt-solid);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius-small);
			color: var(--color-fg);
			font-size: 0.95rem;
			cursor: pointer;
			transition: var(--transition-smooth);
		}

		#${SETTINGS_MODAL_ID} .setting-select:hover {
			border-color: var(--color-accent);
		}

		#${SETTINGS_MODAL_ID} .setting-select:focus {
			outline: none;
			border-color: var(--color-accent);
			box-shadow: 0 0 0 2px var(--color-accent-hover);
		}

		#${SETTINGS_MODAL_ID} .accent-color-controls {
			display: flex;
			gap: 8px;
			align-items: center;
		}

		#${SETTINGS_MODAL_ID} .accent-color-input {
			width: 60px;
			height: 42px;
			border: 2px solid var(--color-border);
			border-radius: var(--border-radius-small);
			cursor: pointer;
			background: transparent;
			transition: var(--transition-smooth);
		}

		#${SETTINGS_MODAL_ID} .accent-color-input:hover {
			border-color: var(--color-accent);
		}

		#${SETTINGS_MODAL_ID} .accent-color-text-input {
			flex: 1;
			padding: 10px 12px;
			background: var(--color-bg-alt-solid);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius-small);
			color: var(--color-fg);
			font-family: monospace;
			font-size: 0.9rem;
			transition: var(--transition-smooth);
		}

		#${SETTINGS_MODAL_ID} .accent-color-text-input:focus {
			outline: none;
			border-color: var(--color-accent);
			box-shadow: 0 0 0 2px var(--color-accent-hover);
		}

		#${SETTINGS_MODAL_ID} .accent-color-text-input:invalid {
			border-color: var(--color-error);
		}

		#${SETTINGS_MODAL_ID} .reset-btn {
			padding: 10px;
			background: var(--color-bg-alt-solid);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius-small);
			color: var(--color-fg);
			cursor: pointer;
			transition: var(--transition-smooth);
			display: flex;
			align-items: center;
			justify-content: center;
		}

		#${SETTINGS_MODAL_ID} .reset-btn:hover {
			background: var(--color-glass);
			border-color: var(--color-accent);
			transform: scale(1.05);
		}

		#${SETTINGS_MODAL_ID} .reset-btn:active {
			transform: scale(0.95);
		}

		#${SETTINGS_MODAL_ID} .accent-color-preview {
			margin-top: 12px;
			padding: 12px;
			background: var(--color-bg-alt-solid);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius-small);
		}

		#${SETTINGS_MODAL_ID} .preview-label {
			font-size: 0.85rem;
			color: var(--color-fg-alt);
			opacity: 0.7;
			margin-bottom: 8px;
		}

		#${SETTINGS_MODAL_ID} .preview-samples {
			display: flex;
			gap: 12px;
			align-items: center;
			flex-wrap: wrap;
		}

		#${SETTINGS_MODAL_ID} .preview-button {
			padding: 8px 16px;
			background: var(--color-btn-bg);
			border: none;
			border-radius: var(--border-radius-small);
			color: var(--color-fg-alt);
			font-weight: 600;
			cursor: pointer;
			transition: var(--transition-smooth);
		}

		#${SETTINGS_MODAL_ID} .preview-button:hover {
			background: var(--color-btn-hover);
			transform: translateY(-1px);
		}

		#${SETTINGS_MODAL_ID} .preview-chip {
			padding: 4px 12px;
			background: var(--color-accent-hover);
			border: 1px solid var(--color-accent);
			border-radius: 16px;
			color: var(--color-accent);
			font-size: 0.85rem;
			font-weight: 600;
		}

		#${SETTINGS_MODAL_ID} .preview-badge {
			padding: 4px 8px;
			background: var(--color-accent);
			border-radius: 4px;
			color: var(--color-fg-alt);
			font-size: 0.75rem;
			font-weight: 700;
		}

		#${SETTINGS_MODAL_ID} .settings-footer {
			margin-top: 24px;
			padding-top: 20px;
			border-top: 1px solid var(--color-border);
			display: flex;
			justify-content: flex-end;
		}

		#${SETTINGS_MODAL_ID} .themed-btn {
			padding: 10px 24px;
			background: var(--color-btn-bg);
			border: none;
			border-radius: var(--border-radius-small);
			color: var(--color-fg-alt);
			font-weight: 600;
			cursor: pointer;
			transition: var(--transition-smooth);
		}

		#${SETTINGS_MODAL_ID} .themed-btn:hover {
			background: var(--color-btn-hover);
			transform: translateY(-1px);
		}

		#${SETTINGS_MODAL_ID} .themed-btn:active {
			transform: translateY(0);
		}
	`;

	document.head.append(style);
}

/**
 * Sets up event handlers for the settings modal
 * @param {HTMLElement} modal - The modal element
 * @param {string} currentEffectiveTheme - Current effective theme
 */
function setupSettingsModalHandlers(modal, currentEffectiveTheme) {
	let effectiveTheme = currentEffectiveTheme;

	// Close button
	const closeBtn = modal.querySelector("#settings-modal-close");
	const closeFooterBtn = modal.querySelector("#settings-close-btn");

	const closeModal = () => {
		modal.classList.remove("show");
		setTimeout(() => {
			modal.style.display = "none";
		}, ANIMATION_DURATION);
	};

	if (closeBtn) {
		addEventListenerWithCleanup(closeBtn, "click", closeModal);
	}

	if (closeFooterBtn) {
		addEventListenerWithCleanup(closeFooterBtn, "click", closeModal);
	}

	// Click outside to close
	addEventListenerWithCleanup(modal, "click", (e) => {
		if (e.target === modal) {
			closeModal();
		}
	});

	// Escape key to close
	const handleEscape = (/** @type {KeyboardEvent} */ e) => {
		if (e.key === "Escape") {
			e.preventDefault();
			closeModal();
			document.removeEventListener("keydown", handleEscape);
		}
	};
	document.addEventListener("keydown", handleEscape);

	// Theme selector
	const themeSelect = modal.querySelector("#theme-select");
	if (themeSelect) {
		addEventListenerWithCleanup(themeSelect, "change", (/** @type {Event} */ e) => {
			const { value: newTheme } = /** @type {HTMLSelectElement} */ (e.target);
			setThemePreference(newTheme, { withTransition: true });

			// Update effective theme for accent color
			effectiveTheme = getEffectiveTheme(newTheme);

			// Reapply current accent color for the new theme
			const colorPicker = modal.querySelector("#accent-color-picker");
			if (colorPicker) {
				const { value: currentColor } = /** @type {HTMLInputElement} */ (colorPicker);
				if (isValidHexColor(currentColor)) {
					setAccentColor(currentColor, effectiveTheme);
				}
			}
		});
	}

	// Max Recent Files selector
	const maxRecentFilesSelect = modal.querySelector("#max-recent-files");
	if (maxRecentFilesSelect) {
		addEventListenerWithCleanup(maxRecentFilesSelect, "change", (/** @type {Event} */ e) => {
			const { value } = /** @type {HTMLSelectElement} */ (e.target);
			localStorage.setItem('maxRecentFiles', value);
		});
	}

	// Accent color picker
	const colorPicker = modal.querySelector("#accent-color-picker");
	const colorText = modal.querySelector("#accent-color-text");
	const resetBtn = modal.querySelector("#reset-accent-color");

	if (colorPicker && colorText) {
		// Sync color picker and text input
		addEventListenerWithCleanup(colorPicker, "input", (/** @type {Event} */ e) => {
			const { value: color } = /** @type {HTMLInputElement} */ (e.target);
			/** @type {HTMLInputElement} */ (colorText).value = color;

			if (isValidHexColor(color)) {
				setAccentColor(color, effectiveTheme);
			}
		});

		addEventListenerWithCleanup(colorText, "input", (/** @type {Event} */ e) => {
			const { target } = e;
			const inputTarget = /** @type {HTMLInputElement} */ (target);
			let { value: color } = inputTarget;
			color = color.trim();

			// Auto-add # if missing
			if (color && !color.startsWith("#")) {
				color = `#${color}`;
				inputTarget.value = color;
			}

			if (isValidHexColor(color)) {
				/** @type {HTMLInputElement} */ (colorPicker).value = color;
				setAccentColor(color, effectiveTheme);
			}
		});
	}

	// Reset accent color
	if (resetBtn) {
		addEventListenerWithCleanup(resetBtn, "click", () => {
			const defaultColor = resetAccentColor(effectiveTheme);

			// Update UI
			if (colorPicker) {
				/** @type {HTMLInputElement} */ (colorPicker).value = defaultColor;
			}
			if (colorText) {
				/** @type {HTMLInputElement} */ (colorText).value = defaultColor;
			}
		});
	}
}

// Export globally for menu integration
if (typeof globalThis !== "undefined") {
	globalThis.showSettingsModal = showSettingsModal;
	globalThis.closeSettingsModal = closeSettingsModal;
}
