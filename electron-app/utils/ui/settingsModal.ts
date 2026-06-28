/**
 * Provides a settings UI for theme and accent color customization.
 */

import { setRendererTheme } from "../state/domain/rendererThemeState.js";
import {
    getEffectiveAccentColor,
    isValidHexColor,
    resetAccentColor,
    setAccentColor,
} from "../theming/core/accentColor.js";
import {
    applyTheme,
    getEffectiveTheme,
    loadTheme,
    THEME_MODES,
} from "../theming/core/theme.js";
import { addEventListenerWithCleanup } from "./events/eventListenerManager.js";
import { createAppIconElement } from "./icons/iconFactory.js";
import { createModalFocusTrap } from "./modals/modalFocusTrap.js";
import type { ElectronMenuEventApi } from "../../shared/preloadApi.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../runtime/electronApiRuntime.js";
import {
    getSettingsModalRuntime,
    type SettingsModalRuntime,
    type SettingsModalTimerHandle,
} from "./settingsModalRuntime.js";

const SETTINGS_MODAL_ID = "settings-modal";
const ANIMATION_DURATION = 300;
const SVG_NS = "http://www.w3.org/2000/svg";

type SettingsModalElectronApi = {
    readonly sendThemeChanged?: ElectronMenuEventApi["sendThemeChanged"];
};
type SettingsModalOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
};

function settingsModalRuntime(): SettingsModalRuntime {
    return getSettingsModalRuntime();
}

let closeAnimationTimer: SettingsModalTimerHandle | undefined;
let focusTrapCleanup: (() => void) | undefined;
let lastFocusedElement: HTMLElement | undefined;
let showAnimationFrameId: null | number = null;

function clearCloseAnimationTimer(): void {
    if (closeAnimationTimer !== undefined) {
        settingsModalRuntime().clearTimeout(closeAnimationTimer);
        closeAnimationTimer = undefined;
    }
}

function scheduleModalClose(modal: HTMLElement): void {
    clearCloseAnimationTimer();
    closeAnimationTimer = settingsModalRuntime().setTimeout(() => {
        closeAnimationTimer = undefined;
        modal.style.display = "none";
        restoreLastFocusedElement();
    }, ANIMATION_DURATION);
}

function cleanupFocusTrap(): void {
    focusTrapCleanup?.();
    focusTrapCleanup = undefined;
}

function restoreLastFocusedElement(): void {
    try {
        lastFocusedElement?.focus();
    } catch {
        /* Ignore focus restoration failures. */
    } finally {
        lastFocusedElement = undefined;
    }
}

function getSettingsModalElectronApi(
    electronApiScope?: RendererElectronApiScope
): SettingsModalElectronApi | null {
    return getRendererElectronApi(
        isSettingsModalElectronApi,
        electronApiScope
    );
}

function isSettingsModalElectronApi(
    value: unknown
): value is SettingsModalElectronApi {
    if (!isRecord(value)) {
        return false;
    }

    return (
        !("sendThemeChanged" in value) ||
        typeof value["sendThemeChanged"] === "function"
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Closes the settings modal.
 */
export function closeSettingsModal(): void {
    const modal = settingsModalRuntime().queryElement<HTMLElement>(
        `#${SETTINGS_MODAL_ID}`
    );
    if (modal) {
        cleanupFocusTrap();
        modal.classList.remove("show");
        scheduleModalClose(modal);
    }
}

function handleCloseSettingsModal(): void {
    closeSettingsModal();
}

/**
 * Shows the settings modal.
 */
export async function showSettingsModal({
    electronApiScope,
}: SettingsModalOptions = {}): Promise<void> {
    let modal = settingsModalRuntime().queryElement<HTMLElement>(
        `#${SETTINGS_MODAL_ID}`
    );

    // Create modal if it doesn't exist
    if (!modal) {
        modal = settingsModalRuntime().createElement("div");
        modal.id = SETTINGS_MODAL_ID;
        modal.className = "modal fancy-modal";
        modal.setAttribute("aria-labelledby", "settings-modal-title");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("role", "dialog");
        modal.style.display = "none";
        settingsModalRuntime().appendToBody(modal);

        // Inject styles (from aboutModal styles)
        const { injectModalStyles } =
            await import("./modals/injectModalStyles.js");
        injectModalStyles();
    }

    // Inject settings-specific styles
    injectSettingsModalStyles();

    // Get current theme and accent color
    const currentTheme = loadTheme();
    const safeTheme = Object.values(THEME_MODES).includes(currentTheme)
        ? currentTheme
        : THEME_MODES.AUTO;
    const effectiveTheme = getEffectiveTheme(safeTheme);
    const currentAccent = getEffectiveAccentColor(effectiveTheme);
    const safeAccent = isValidHexColor(currentAccent)
        ? currentAccent
        : getEffectiveAccentColor(effectiveTheme);

    // Set modal content
    modal.replaceChildren(createSettingsModalContent(safeTheme, safeAccent));
    lastFocusedElement = settingsModalRuntime().getActiveHTMLElement();

    // Show modal with animation
    modal.style.display = "flex";
    if (showAnimationFrameId !== null) {
        settingsModalRuntime().cancelAnimationFrame(showAnimationFrameId);
    }
    showAnimationFrameId = settingsModalRuntime().requestAnimationFrame(() => {
        showAnimationFrameId = null;
        modal.classList.add("show");
    });

    // Setup event handlers
    setupSettingsModalHandlers(modal, effectiveTheme, electronApiScope);
    cleanupFocusTrap();
    focusTrapCleanup = createModalFocusTrap(
        modal,
        modal.querySelector<HTMLElement>("#settings-modal-close")
    );
}

/**
 * Creates the settings modal content.
 */
function createSettingsModalContent(
    currentTheme: string,
    currentAccent: string
): HTMLElement {
    const backdrop = settingsModalRuntime().createElement("div");
    backdrop.className = "modal-backdrop";

    const content = settingsModalRuntime().createElement("div");
    content.className = "modal-content";
    content.style.maxWidth = "600px";

    const header = settingsModalRuntime().createElement("div");
    header.className = "modal-header";

    const iconWrapper = settingsModalRuntime().createElement("div");
    iconWrapper.className = "modal-icon";
    iconWrapper.append(createAppIconElement("settings", { size: 32 }));

    const closeButton = settingsModalRuntime().createElement("button");
    closeButton.id = "settings-modal-close";
    closeButton.className = "modal-close";
    closeButton.type = "button";
    closeButton.tabIndex = 0;
    closeButton.setAttribute("aria-label", "Close settings");
    closeButton.append(createCloseIcon());

    header.append(iconWrapper, closeButton);

    const body = settingsModalRuntime().createElement("div");
    body.className = "modal-body";

    const title = settingsModalRuntime().createElement("h2");
    title.id = "settings-modal-title";
    title.className = "modal-title";
    title.textContent = "Settings";

    const subtitle = settingsModalRuntime().createElement("p");
    subtitle.className = "modal-subtitle";
    subtitle.textContent = "Customize your FitFileViewer experience";

    const settingsSection = settingsModalRuntime().createElement("div");
    settingsSection.className = "settings-section";

    const sectionTitle = settingsModalRuntime().createElement("h3");
    sectionTitle.className = "settings-section-title";
    sectionTitle.textContent = "🎨 Appearance";

    settingsSection.append(
        sectionTitle,
        createThemeSetting(currentTheme),
        createAccentSetting(currentAccent)
    );

    const footer = settingsModalRuntime().createElement("div");
    footer.className = "settings-footer";
    const footerCloseButton = settingsModalRuntime().createElement("button");
    footerCloseButton.id = "settings-close-btn";
    footerCloseButton.className = "themed-btn";
    footerCloseButton.type = "button";
    footerCloseButton.textContent = "Close";
    footer.append(footerCloseButton);

    body.append(title, subtitle, settingsSection, footer);
    content.append(header, body);
    backdrop.append(content);

    return backdrop;
}

function createCloseIcon(): SVGSVGElement {
    const icon = createSvgIcon();
    const path = settingsModalRuntime().createSvgElement("path");
    path.setAttribute("d", "M18 6L6 18M6 6l12 12");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    icon.append(path);

    return icon;
}

function createResetIcon(): SVGSVGElement {
    const icon = createSvgIcon();
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");

    const firstPath = settingsModalRuntime().createSvgElement("path");
    firstPath.setAttribute("d", "M1 4v6h6M23 20v-6h-6");
    const secondPath = settingsModalRuntime().createSvgElement("path");
    secondPath.setAttribute(
        "d",
        "M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
    );

    for (const path of [firstPath, secondPath]) {
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
    }
    icon.append(firstPath, secondPath);

    return icon;
}

function createSvgIcon(): SVGSVGElement {
    const icon = settingsModalRuntime().createSvgElement("svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("xmlns", SVG_NS);
    return icon;
}

function createThemeSetting(currentTheme: string): HTMLElement {
    const item = settingsModalRuntime().createElement("div");
    item.className = "setting-item";

    const label = settingsModalRuntime().createElement("label");
    label.className = "setting-label";
    label.htmlFor = "theme-select";
    label.textContent = "Theme";

    const select = settingsModalRuntime().createElement("select");
    select.id = "theme-select";
    select.className = "setting-select";
    select.append(
        createThemeOption(
            THEME_MODES.AUTO,
            "Auto (Follow System)",
            currentTheme
        ),
        createThemeOption(THEME_MODES.DARK, "Dark", currentTheme),
        createThemeOption(THEME_MODES.LIGHT, "Light", currentTheme)
    );

    item.append(label, select);

    return item;
}

function createThemeOption(
    value: string,
    label: string,
    currentTheme: string
): HTMLOptionElement {
    const option = settingsModalRuntime().createElement("option");
    option.value = value;
    option.selected = currentTheme === value;
    option.textContent = label;

    return option;
}

function createAccentSetting(currentAccent: string): HTMLElement {
    const item = settingsModalRuntime().createElement("div");
    item.className = "setting-item";

    const label = settingsModalRuntime().createElement("label");
    label.className = "setting-label";
    label.htmlFor = "accent-color-picker";
    label.textContent = "Accent Color";

    const controls = settingsModalRuntime().createElement("div");
    controls.className = "accent-color-controls";
    controls.append(
        createAccentColorInput(currentAccent),
        createAccentTextInput(currentAccent),
        createResetButton()
    );

    const preview = settingsModalRuntime().createElement("div");
    preview.className = "accent-color-preview";

    const previewLabel = settingsModalRuntime().createElement("div");
    previewLabel.className = "preview-label";
    previewLabel.textContent = "Preview:";

    const previewSamples = settingsModalRuntime().createElement("div");
    previewSamples.className = "preview-samples";

    const previewButton = settingsModalRuntime().createElement("button");
    previewButton.className = "preview-button";
    previewButton.type = "button";
    previewButton.textContent = "Button";

    const previewChip = settingsModalRuntime().createElement("div");
    previewChip.className = "preview-chip";
    previewChip.textContent = "Chip";

    const previewBadge = settingsModalRuntime().createElement("div");
    previewBadge.className = "preview-badge";
    previewBadge.textContent = "Badge";

    previewSamples.append(previewButton, previewChip, previewBadge);
    preview.append(previewLabel, previewSamples);
    item.append(label, controls, preview);

    return item;
}

function createAccentColorInput(currentAccent: string): HTMLInputElement {
    const input = settingsModalRuntime().createElement("input");
    input.id = "accent-color-picker";
    input.className = "accent-color-input";
    input.type = "color";
    input.value = currentAccent;
    input.title = "Choose accent color";

    return input;
}

function createAccentTextInput(currentAccent: string): HTMLInputElement {
    const input = settingsModalRuntime().createElement("input");
    input.id = "accent-color-text";
    input.className = "accent-color-text-input";
    input.type = "text";
    input.value = currentAccent;
    input.pattern = "^#[0-9A-Fa-f]{6}$";
    input.placeholder = "#3b82f6";
    input.maxLength = 7;

    return input;
}

function createResetButton(): HTMLButtonElement {
    const button = settingsModalRuntime().createElement("button");
    button.id = "reset-accent-color";
    button.className = "reset-btn";
    button.type = "button";
    button.title = "Reset to default";
    button.append(createResetIcon());

    return button;
}

/**
 * Injects CSS styles for the settings modal.
 */
function injectSettingsModalStyles(): void {
    if (settingsModalRuntime().queryElement("#settings-modal-styles")) {
        return;
    }

    const style = settingsModalRuntime().createElement("style");
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

    settingsModalRuntime().appendToHead(style);
}

/**
 * Sets up event handlers for the settings modal.
 */
function setupSettingsModalHandlers(
    modal: HTMLElement,
    currentEffectiveTheme: string,
    electronApiScope?: RendererElectronApiScope
): void {
    let effectiveTheme = currentEffectiveTheme;

    // Close button
    const closeBtn = modal.querySelector<HTMLButtonElement>(
        "#settings-modal-close"
    );
    const closeFooterBtn = modal.querySelector<HTMLButtonElement>(
        "#settings-close-btn"
    );

    if (closeBtn) {
        addEventListenerWithCleanup(
            closeBtn,
            "click",
            handleCloseSettingsModal
        );
    }

    if (closeFooterBtn) {
        addEventListenerWithCleanup(
            closeFooterBtn,
            "click",
            handleCloseSettingsModal
        );
    }

    // Click outside to close
    addEventListenerWithCleanup(modal, "click", (event: Event) => {
        if (event.target === modal) {
            handleCloseSettingsModal();
        }
    });

    // Escape key to close
    let cleanupEscape: (() => void) | undefined;
    const handleEscape = (event: Event) => {
        if (
            settingsModalRuntime().isKeyboardEvent(event) &&
            event.key === "Escape"
        ) {
            event.preventDefault();
            handleCloseSettingsModal();
            cleanupEscape?.();
            cleanupEscape = undefined;
        }
    };
    cleanupEscape = addEventListenerWithCleanup(
        settingsModalRuntime().getDocumentEventTarget(),
        "keydown",
        handleEscape
    );

    // Theme selector
    const themeSelect = modal.querySelector<HTMLSelectElement>("#theme-select");
    if (themeSelect) {
        addEventListenerWithCleanup(themeSelect, "change", (event: Event) => {
            if (!settingsModalRuntime().isHTMLSelectElement(event.target)) {
                return;
            }
            const newTheme = event.target.value;
            // Theme is controlled by state; applying directly without updating state
            // causes other parts of the app (and/or the main process) to re-assert
            // the previous theme on the next interaction.
            //
            // - Theme core persists: "auto" | "dark" | "light"
            // - UI/state layer historically uses: "system" for auto
            const stateTheme =
                newTheme === THEME_MODES.AUTO ? "system" : newTheme;

            try {
                setRendererTheme(stateTheme, {
                    source: "settingsModal:theme-select",
                });
            } catch {
                // Fallback for environments where state management is unavailable.
                applyTheme(newTheme, true);
            }

            // Keep the main process in sync so it doesn't override the renderer's
            // theme later (e.g., after focus/menu interactions).
            try {
                getSettingsModalElectronApi(
                    electronApiScope
                )?.sendThemeChanged?.(newTheme);
            } catch {
                /* ignore */
            }

            // Update effective theme for accent color
            effectiveTheme = getEffectiveTheme(newTheme);

            // Reapply current accent color for the new theme
            const colorPicker = modal.querySelector<HTMLInputElement>(
                "#accent-color-picker"
            );
            if (colorPicker) {
                const currentColor = colorPicker.value;
                if (isValidHexColor(currentColor)) {
                    setAccentColor(currentColor, effectiveTheme);
                }
            }
        });
    }

    // Accent color picker
    const colorPicker = modal.querySelector<HTMLInputElement>(
        "#accent-color-picker"
    );
    const colorText =
        modal.querySelector<HTMLInputElement>("#accent-color-text");
    const resetBtn = modal.querySelector<HTMLButtonElement>(
        "#reset-accent-color"
    );

    if (colorPicker && colorText) {
        // Sync color picker and text input
        addEventListenerWithCleanup(colorPicker, "input", (event: Event) => {
            if (!settingsModalRuntime().isHTMLInputElement(event.target)) {
                return;
            }
            const color = event.target.value;
            colorText.value = color;

            if (isValidHexColor(color)) {
                setAccentColor(color, effectiveTheme);
            }
        });

        addEventListenerWithCleanup(colorText, "input", (event: Event) => {
            if (!settingsModalRuntime().isHTMLInputElement(event.target)) {
                return;
            }
            let color = event.target.value.trim();

            // Auto-add # if missing
            if (color && !color.startsWith("#")) {
                color = `#${color}`;
                event.target.value = color;
            }

            if (isValidHexColor(color)) {
                colorPicker.value = color;
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
                colorPicker.value = defaultColor;
            }
            if (colorText) {
                colorText.value = defaultColor;
            }
        });
    }
}
