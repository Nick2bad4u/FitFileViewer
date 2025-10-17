/**
 * @fileoverview Accent Color Picker Modal
 * @description Interactive modal for selecting and customizing accent colors
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

import {
    getDefaultAccentColor,
    getEffectiveAccentColor,
    resetAccentColor,
    setAccentColor,
} from "../../utils/theming/core/accentColor.js";
import { getEffectiveTheme, loadTheme } from "../../utils/theming/core/theme.js";

/**
 * Preset accent colors for quick selection
 * @private
 */
const PRESET_COLORS = [
    { hex: "#3b82f6", name: "Blue" },
    { hex: "#ef4444", name: "Red" },
    { hex: "#22c55e", name: "Green" },
    { hex: "#f59e0b", name: "Amber" },
    { hex: "#8b5cf6", name: "Purple" },
    { hex: "#ec4899", name: "Pink" },
    { hex: "#06b6d4", name: "Cyan" },
    { hex: "#f97316", name: "Orange" },
    { hex: "#14b8a6", name: "Teal" },
    { hex: "#6366f1", name: "Indigo" },
];

/**
 * Opens the accent color picker modal
 */
export function openAccentColorPicker() {
    // Check if modal already exists
    let modal = document.getElementById("accent-color-modal");
    if (modal) {
        modal.style.display = "block";
        updatePreview();
        return;
    }

    // Create modal
    modal = createModal();
    document.body.append(modal);

    // Show modal
    modal.style.display = "block";
    updatePreview();
}

/**
 * Adds CSS styles for the modal
 * @private
 */
function addModalStyles() {
    if (document.getElementById("accent-picker-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "accent-picker-styles";
    style.textContent = `
		.accent-picker-modal {
			display: none;
			position: fixed;
			z-index: 10000;
			left: 0;
			top: 0;
			width: 100%;
			height: 100%;
			background-color: rgba(0, 0, 0, 0.5);
		}

		.accent-picker-content {
			background-color: var(--color-background);
			color: var(--color-text);
			margin: 5% auto;
			padding: 0;
			border: 1px solid var(--color-border);
			border-radius: 8px;
			width: 90%;
			max-width: 500px;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		}

		.accent-picker-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1rem 1.5rem;
			border-bottom: 1px solid var(--color-border);
		}

		.accent-picker-header h2 {
			margin: 0;
			font-size: 1.25rem;
			color: var(--color-text);
		}

		.close-btn {
			background: none;
			border: none;
			font-size: 1.5rem;
			cursor: pointer;
			color: var(--color-text-muted);
			padding: 0;
			width: 2rem;
			height: 2rem;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.close-btn:hover {
			color: var(--color-text);
		}

		.accent-picker-body {
			padding: 1.5rem;
		}

		.current-theme-info {
			margin-bottom: 1.5rem;
			padding: 0.75rem;
			background: var(--color-surface);
			border-radius: 4px;
		}

		.current-theme-info strong {
			color: var(--color-text);
		}

		#current-theme-name {
			text-transform: capitalize;
			color: var(--color-accent);
			font-weight: 500;
		}

		.color-preview-section {
			margin-bottom: 1.5rem;
			text-align: center;
		}

		.preview-label {
			font-size: 0.875rem;
			color: var(--color-text-muted);
			margin-bottom: 0.5rem;
		}

		.color-preview {
			width: 100px;
			height: 100px;
			margin: 0.5rem auto;
			border-radius: 50%;
			border: 3px solid var(--color-border);
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}

		.preview-hex {
			font-family: monospace;
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--color-text);
		}

		.section-title {
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--color-text);
			margin-bottom: 0.75rem;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.preset-colors-section {
			margin-bottom: 1.5rem;
		}

		.preset-colors {
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: 0.75rem;
		}

		.preset-color {
			width: 100%;
			aspect-ratio: 1;
			border-radius: 4px;
			border: 2px solid var(--color-border);
			cursor: pointer;
			transition: all 0.2s;
			position: relative;
		}

		.preset-color:hover {
			transform: scale(1.1);
			border-color: var(--color-text);
		}

		.preset-color.selected {
			border-color: var(--color-text);
			border-width: 3px;
			box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px var(--color-accent);
		}

		.preset-color::after {
			content: attr(title);
			position: absolute;
			bottom: -1.5rem;
			left: 50%;
			transform: translateX(-50%);
			font-size: 0.75rem;
			white-space: nowrap;
			opacity: 0;
			transition: opacity 0.2s;
			pointer-events: none;
			color: var(--color-text-muted);
		}

		.preset-color:hover::after {
			opacity: 1;
		}

		.custom-color-section {
			margin-bottom: 1.5rem;
		}

		.custom-color-input {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}

		.custom-color-input label {
			font-size: 0.875rem;
			color: var(--color-text-muted);
		}

		#custom-color-picker {
			width: 60px;
			height: 40px;
			border: 2px solid var(--color-border);
			border-radius: 4px;
			cursor: pointer;
		}

		#custom-color-text {
			flex: 1;
			padding: 0.5rem;
			border: 1px solid var(--color-border);
			border-radius: 4px;
			background: var(--color-surface);
			color: var(--color-text);
			font-family: monospace;
		}

		#custom-color-text:focus {
			outline: none;
			border-color: var(--color-accent);
		}

		.accent-picker-footer {
			display: flex;
			justify-content: space-between;
			padding: 1rem 1.5rem;
			border-top: 1px solid var(--color-border);
		}

		.btn-reset, .btn-apply {
			padding: 0.5rem 1.5rem;
			border: none;
			border-radius: 4px;
			font-size: 0.875rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}

		.btn-reset {
			background: var(--color-surface);
			color: var(--color-text);
			border: 1px solid var(--color-border);
		}

		.btn-reset:hover {
			background: var(--color-border);
		}

		.btn-apply {
			background: var(--color-btn-bg);
			color: white;
		}

		.btn-apply:hover {
			background: var(--color-btn-hover);
		}
	`;
    document.head.append(style);
}

/**
 * Applies a color and updates the preview
 * @param {string} color - The hex color code
 * @private
 */
function applyColor(color) {
    const currentTheme = loadTheme();
    const theme = getEffectiveTheme(currentTheme);
    if (setAccentColor(color, theme)) {
        updatePreview();
    }
}

/**
 * Creates the modal element and its content
 * @returns {HTMLElement} The modal element
 * @private
 */
function createModal() {
    const modal = document.createElement("div");
    modal.id = "accent-color-modal";
    modal.className = "accent-picker-modal";

    modal.innerHTML = `
		<div class="accent-picker-content">
			<div class="accent-picker-header">
				<h2>Customize Accent Color</h2>
				<button class="close-btn" id="accent-picker-close">&times;</button>
			</div>

			<div class="accent-picker-body">
				<div class="current-theme-info">
					<strong>Current Theme:</strong> <span id="current-theme-name"></span>
				</div>

				<div class="color-preview-section">
					<div class="preview-label">Current Accent Color:</div>
					<div class="color-preview" id="accent-color-preview"></div>
					<div class="preview-hex" id="accent-color-hex"></div>
				</div>

				<div class="preset-colors-section">
					<div class="section-title">Preset Colors</div>
					<div class="preset-colors" id="preset-colors"></div>
				</div>

				<div class="custom-color-section">
					<div class="section-title">Custom Color</div>
					<div class="custom-color-input">
						<label for="custom-color-picker">Pick a color:</label>
						<input type="color" id="custom-color-picker" />
						<input type="text" id="custom-color-text" placeholder="#3b82f6" maxlength="7" />
					</div>
				</div>
			</div>

			<div class="accent-picker-footer">
				<button class="btn-reset" id="accent-color-reset">Reset to Default</button>
				<button class="btn-apply" id="accent-color-apply">Apply</button>
			</div>
		</div>
	`;

    // Add styles
    addModalStyles();

    // Add event listeners
    setupEventListeners(modal);

    return modal;
}

/**
 * Renders the preset color buttons
 * @param {HTMLElement} modal - The modal element
 * @private
 */
function renderPresetColors(modal) {
    const container = modal.querySelector("#preset-colors");
    container.innerHTML = "";

    for (const preset of PRESET_COLORS) {
        const button = document.createElement("button");
        button.className = "preset-color";
        button.style.backgroundColor = preset.hex;
        button.title = preset.name;
        button.addEventListener("click", () => {
            applyColor(preset.hex);
        });
        container.append(button);
    }
}

/**
 * Converts RGB color to hex
 * @param {string} rgb - RGB color string
 * @returns {string} Hex color
 * @private
 */
function rgbToHex(rgb) {
    if (rgb.startsWith("#")) {
        return rgb.toLowerCase();
    }
    const match = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgb);
    if (!match) {
        return rgb;
    }
    const r = Number.parseInt(match[1], 10);
    const g = Number.parseInt(match[2], 10);
    const b = Number.parseInt(match[3], 10);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Sets up event listeners for the modal
 * @param {HTMLElement} modal - The modal element
 * @private
 */
function setupEventListeners(modal) {
    const closeBtn = modal.querySelector("#accent-picker-close");
    const resetBtn = modal.querySelector("#accent-color-reset");
    const applyBtn = modal.querySelector("#accent-color-apply");
    const customPicker = modal.querySelector("#custom-color-picker");
    const customText = modal.querySelector("#custom-color-text");

    // Close button
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Click outside to close
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Reset button
    resetBtn.addEventListener("click", () => {
        const currentTheme = loadTheme();
        const theme = getEffectiveTheme(currentTheme);
        resetAccentColor(theme);
        updatePreview();
    });

    // Apply button
    applyBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Custom color picker
    customPicker.addEventListener("input", (event) => {
        const color = event.target.value;
        customText.value = color;
        applyColor(color);
    });

    // Custom color text input
    customText.addEventListener("input", (event) => {
        const color = event.target.value;
        if (/^#[\da-f]{6}$/i.test(color)) {
            customPicker.value = color;
            applyColor(color);
        }
    });

    // Render preset colors
    renderPresetColors(modal);
}

/**
 * Updates the preview with the current accent color
 * @private
 */
function updatePreview() {
    const currentTheme = loadTheme();
    const theme = getEffectiveTheme(currentTheme);
    const color = getEffectiveAccentColor(theme);
    const defaultColor = getDefaultAccentColor(theme);

    // Update theme name
    const themeName = document.getElementById("current-theme-name");
    if (themeName) {
        themeName.textContent = theme;
    }

    // Update preview
    const preview = document.getElementById("accent-color-preview");
    if (preview) {
        preview.style.backgroundColor = color;
    }

    // Update hex display
    const hex = document.getElementById("accent-color-hex");
    if (hex) {
        hex.textContent = color.toUpperCase();
    }

    // Update custom inputs
    const customPicker = document.getElementById("custom-color-picker");
    if (customPicker) {
        customPicker.value = color;
    }

    const customText = document.getElementById("custom-color-text");
    if (customText) {
        customText.value = color;
    }

    // Highlight selected preset
    const presetButtons = document.querySelectorAll(".preset-color");
    for (const button of presetButtons) {
        button.classList.toggle("selected", button.style.backgroundColor === rgbToHex(color));
    }

    // Update reset button state
    const resetBtn = document.getElementById("accent-color-reset");
    if (resetBtn) {
        resetBtn.disabled = color === defaultColor;
    }
}
