/** Interactive modal for selecting and customizing accent colors. */

import {
    getDefaultAccentColor,
    getEffectiveAccentColor,
    resetAccentColor,
    setAccentColor,
} from "../../utils/theming/core/accentColor.js";
import {
    getEffectiveTheme,
    loadTheme,
} from "../../utils/theming/core/theme.js";

// Preset accent colors for quick selection.
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
] as const;

/**
 * Opens the accent color picker modal, creating it on first use.
 */
export function openAccentColorPicker(): void {
    let modal = document.getElementById("accent-color-modal");
    if (modal) {
        modal.style.display = "block";
        updatePreview();
        return;
    }

    modal = createModal();
    document.body.append(modal);

    modal.style.display = "block";
    updatePreview();
}

function addModalStyles(): void {
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
			inset: 0;
			background: var(--color-overlay-bg);
			/* stylelint-disable property-no-vendor-prefix -- Electron/Chromium */
			-webkit-backdrop-filter: var(--backdrop-blur);
			/* stylelint-enable property-no-vendor-prefix */
			backdrop-filter: var(--backdrop-blur);
			padding: clamp(16px, 4vi, 40px);
			overflow: auto;

			/*
				This modal originated upstream with variables like --color-background,
				--color-text, --color-text-muted.
				FitFileViewer uses --color-bg/--color-fg/etc. Define local aliases so
				the modal never becomes transparent/illegible.
			*/
			--accent-picker-bg: var(--color-surface);
			--accent-picker-fg: var(--color-fg);
			--accent-picker-muted: rgb(var(--color-fg-rgb) / 72%);
			--accent-picker-border: var(--color-glass-border);
			--accent-picker-input-bg: rgb(var(--color-surface-rgb) / 70%);
		}

		.accent-picker-content {
			background: var(--accent-picker-bg);
			color: var(--accent-picker-fg);
			margin: min(8vb, 72px) auto;
			padding: 0;
			border: 1px solid var(--accent-picker-border);
			border-radius: var(--border-radius);
			width: 90%;
			max-width: 560px;
			box-shadow: var(--color-box-shadow);
			/* stylelint-disable property-no-vendor-prefix -- Electron/Chromium */
			-webkit-backdrop-filter: var(--backdrop-blur);
			/* stylelint-enable property-no-vendor-prefix */
			backdrop-filter: var(--backdrop-blur);
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
			color: var(--accent-picker-fg);
		}

		.close-btn {
			background: none;
			border: none;
			font-size: 1.5rem;
			cursor: pointer;
			color: var(--accent-picker-muted);
			padding: 0;
			width: 2rem;
			height: 2rem;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.close-btn:hover {
			color: var(--accent-picker-fg);
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
			color: var(--accent-picker-fg);
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
			color: var(--accent-picker-muted);
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
			color: var(--accent-picker-fg);
		}

		.section-title {
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--accent-picker-fg);
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
			border-color: var(--accent-picker-fg);
		}

		.preset-color.selected {
			border-color: var(--accent-picker-fg);
			border-width: 3px;
			box-shadow: 0 0 0 2px var(--color-bg-solid), 0 0 0 4px var(--color-accent);
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
			color: var(--accent-picker-muted);
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
			color: var(--accent-picker-muted);
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
			background: var(--accent-picker-input-bg);
			color: var(--accent-picker-fg);
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
			background: var(--accent-picker-input-bg);
			color: var(--accent-picker-fg);
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

function applyColor(color: string): void {
    const currentTheme = loadTheme();
    const theme = getEffectiveTheme(currentTheme);
    if (setAccentColor(color, theme)) {
        updatePreview();
    }
}

function createModal(): HTMLDivElement {
    const modal = document.createElement("div");
    modal.id = "accent-color-modal";
    modal.className = "accent-picker-modal";
    modal.append(createModalContent());

    addModalStyles();

    setupEventListeners(modal);

    return modal;
}

function createModalContent(): HTMLDivElement {
    const content = document.createElement("div");
    content.className = "accent-picker-content";
    content.append(createModalHeader(), createModalBody(), createModalFooter());

    return content;
}

function createModalHeader(): HTMLDivElement {
    const header = document.createElement("div");
    header.className = "accent-picker-header";

    const title = document.createElement("h2");
    title.textContent = "Customize Accent Color";

    const close = document.createElement("button");
    close.className = "close-btn";
    close.id = "accent-picker-close";
    close.type = "button";
    close.textContent = "×";

    header.append(title, close);

    return header;
}

function createModalBody(): HTMLDivElement {
    const body = document.createElement("div");
    body.className = "accent-picker-body";
    body.append(
        createCurrentThemeSection(),
        createColorPreviewSection(),
        createPresetColorSection(),
        createCustomColorSection()
    );

    return body;
}

function createCurrentThemeSection(): HTMLDivElement {
    const section = document.createElement("div");
    section.className = "current-theme-info";

    const label = document.createElement("strong");
    label.textContent = "Current Theme:";

    const themeName = document.createElement("span");
    themeName.id = "current-theme-name";

    section.append(label, document.createTextNode(" "), themeName);

    return section;
}

function createColorPreviewSection(): HTMLDivElement {
    const section = document.createElement("div");
    section.className = "color-preview-section";

    const label = document.createElement("div");
    label.className = "preview-label";
    label.textContent = "Current Accent Color:";

    const preview = document.createElement("div");
    preview.className = "color-preview";
    preview.id = "accent-color-preview";

    const hex = document.createElement("div");
    hex.className = "preview-hex";
    hex.id = "accent-color-hex";

    section.append(label, preview, hex);

    return section;
}

function createPresetColorSection(): HTMLDivElement {
    const section = document.createElement("div");
    section.className = "preset-colors-section";
    section.append(
        createSectionTitle("Preset Colors"),
        createEmptyContainer("preset-colors", "preset-colors")
    );

    return section;
}

function createCustomColorSection(): HTMLDivElement {
    const section = document.createElement("div");
    section.className = "custom-color-section";

    const inputRow = document.createElement("div");
    inputRow.className = "custom-color-input";

    const label = document.createElement("label");
    label.htmlFor = "custom-color-picker";
    label.textContent = "Pick a color:";

    const picker = document.createElement("input");
    picker.type = "color";
    picker.id = "custom-color-picker";

    const text = document.createElement("input");
    text.type = "text";
    text.id = "custom-color-text";
    text.placeholder = "#3b82f6";
    text.maxLength = 7;

    inputRow.append(label, picker, text);
    section.append(createSectionTitle("Custom Color"), inputRow);

    return section;
}

function createModalFooter(): HTMLDivElement {
    const footer = document.createElement("div");
    footer.className = "accent-picker-footer";

    const reset = document.createElement("button");
    reset.className = "btn-reset";
    reset.id = "accent-color-reset";
    reset.type = "button";
    reset.textContent = "Reset to Default";

    const apply = document.createElement("button");
    apply.className = "btn-apply";
    apply.id = "accent-color-apply";
    apply.type = "button";
    apply.textContent = "Apply";

    footer.append(reset, apply);

    return footer;
}

function createSectionTitle(text: string): HTMLDivElement {
    const title = document.createElement("div");
    title.className = "section-title";
    title.textContent = text;

    return title;
}

function createEmptyContainer(className: string, id: string): HTMLDivElement {
    const container = document.createElement("div");
    container.className = className;
    container.id = id;

    return container;
}

function renderPresetColors(modal: HTMLElement, signal: AbortSignal): void {
    const container = modal.querySelector("#preset-colors");
    if (!(container instanceof HTMLElement)) {
        return;
    }

    container.replaceChildren();

    for (const preset of PRESET_COLORS) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "preset-color";
        button.dataset["hex"] = preset.hex;
        button.style.backgroundColor = preset.hex;
        button.title = preset.name;
        button.addEventListener(
            "click",
            () => {
                applyColor(preset.hex);
            },
            { signal }
        );
        container.append(button);
    }
}

function setupEventListeners(modal: HTMLElement): void {
    const { signal } = new AbortController();
    const closeBtn = modal.querySelector("#accent-picker-close");
    const resetBtn = modal.querySelector("#accent-color-reset");
    const applyBtn = modal.querySelector("#accent-color-apply");
    const customPicker = modal.querySelector("#custom-color-picker");
    const customText = modal.querySelector("#custom-color-text");

    closeBtn?.addEventListener(
        "click",
        () => {
            modal.style.display = "none";
        },
        { signal }
    );

    modal.addEventListener(
        "click",
        (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        },
        { signal }
    );

    resetBtn?.addEventListener(
        "click",
        () => {
            const currentTheme = loadTheme();
            const theme = getEffectiveTheme(currentTheme);
            resetAccentColor(theme);
            updatePreview();
        },
        { signal }
    );

    applyBtn?.addEventListener(
        "click",
        () => {
            modal.style.display = "none";
        },
        { signal }
    );

    if (
        customPicker instanceof HTMLInputElement &&
        customText instanceof HTMLInputElement
    ) {
        customPicker.addEventListener(
            "input",
            () => {
                const { value: color } = customPicker;
                customText.value = color;
                applyColor(color);
            },
            { signal }
        );

        customText.addEventListener(
            "input",
            () => {
                const { value: color } = customText;
                if (/^#[\dA-Fa-f]{6}$/.test(color)) {
                    customPicker.value = color;
                    applyColor(color);
                }
            },
            { signal }
        );
    }

    renderPresetColors(modal, signal);
}

function updatePreview(): void {
    const currentTheme = loadTheme();
    const theme = getEffectiveTheme(currentTheme);
    const color = getEffectiveAccentColor(theme);
    const defaultColor = getDefaultAccentColor(theme);
    const normalizedColor = color.toLowerCase();

    const themeName = document.getElementById("current-theme-name");
    if (themeName) {
        themeName.textContent = theme;
    }

    const preview = document.getElementById("accent-color-preview");
    if (preview instanceof HTMLElement) {
        preview.style.backgroundColor = color;
    }

    const hex = document.getElementById("accent-color-hex");
    if (hex) {
        hex.textContent = color.toUpperCase();
    }

    const customPicker = document.getElementById("custom-color-picker");
    if (customPicker instanceof HTMLInputElement) {
        customPicker.value = color;
    }

    const customText = document.getElementById("custom-color-text");
    if (customText instanceof HTMLInputElement) {
        customText.value = color;
    }

    const presetButtons = document.querySelectorAll(".preset-color");
    for (const button of presetButtons) {
        button.classList.toggle(
            "selected",
            button instanceof HTMLElement &&
                button.dataset["hex"] === normalizedColor
        );
    }

    const resetBtn = document.getElementById("accent-color-reset");
    if (resetBtn instanceof HTMLButtonElement) {
        resetBtn.disabled = color === defaultColor;
    }
}
