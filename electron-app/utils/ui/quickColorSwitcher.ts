import {
    getEffectiveAccentColor,
    setAccentColor,
} from "../theming/core/accentColor.js";
import { getEffectiveTheme, loadTheme } from "../theming/core/theme.js";
import {
    getQuickColorSwitcherRuntime,
    type QuickColorSwitcherTimerHandle,
} from "./quickColorSwitcherRuntime.js";

interface ColorPreset {
    readonly color: string;
    readonly name: string;
}

interface QuickColorSwitcherState {
    closeTimer: QuickColorSwitcherTimerHandle | null;
    listenerController: AbortController;
}

const COLOR_PRESETS = [
    { color: "#3b82f6", name: "Blue-tiful" },
    { color: "#8b5cf6", name: "Purple Rain" },
    { color: "#ec4899", name: "Pink Panther" },
    { color: "#10b981", name: "Green Machine" },
    { color: "#f59e0b", name: "Golden Hour" },
    { color: "#ef4444", name: "Red Hot" },
    { color: "#06b6d4", name: "Cyan-tific" },
    { color: "#f97316", name: "Orange Crush" },
] as const satisfies readonly ColorPreset[];

const SWITCHER_ID = "quick-color-switcher";
const SWITCHER_CLOSE_DELAY_MS = 500;
const SVG_NS = "http://www.w3.org/2000/svg";
const quickColorSwitcherStates = new WeakMap<
    HTMLDivElement,
    QuickColorSwitcherState
>();
const quickColorSwitcherRuntime = getQuickColorSwitcherRuntime();
const trackedQuickColorSwitcherElements = new Set<HTMLDivElement>();

function createPaletteIcon(): SVGSVGElement {
    const icon = quickColorSwitcherRuntime.createSvgElement("svg");
    icon.classList.add("switcher-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("xmlns", SVG_NS);

    const path = quickColorSwitcherRuntime.createSvgElement("path");
    path.setAttribute(
        "d",
        "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
    );
    path.setAttribute("fill", "currentColor");

    const circle = quickColorSwitcherRuntime.createSvgElement("circle");
    circle.setAttribute("cx", "12");
    circle.setAttribute("cy", "12");
    circle.setAttribute("r", "5");
    circle.setAttribute("fill", "currentColor");
    circle.setAttribute("opacity", "0.7");
    icon.append(path, circle);

    return icon;
}

function createSettingsIcon(): SVGSVGElement {
    const icon = quickColorSwitcherRuntime.createSvgElement("svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("xmlns", SVG_NS);
    icon.setAttribute("width", "16");
    icon.setAttribute("height", "16");

    const circlePath = quickColorSwitcherRuntime.createSvgElement("path");
    circlePath.setAttribute("d", "M12 15a3 3 0 100-6 3 3 0 000 6z");
    circlePath.setAttribute("stroke", "currentColor");
    circlePath.setAttribute("stroke-width", "2");
    circlePath.setAttribute("stroke-linecap", "round");
    circlePath.setAttribute("stroke-linejoin", "round");

    const gearPath = quickColorSwitcherRuntime.createSvgElement("path");
    gearPath.setAttribute(
        "d",
        "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
    );
    gearPath.setAttribute("stroke", "currentColor");
    gearPath.setAttribute("stroke-width", "2");
    gearPath.setAttribute("stroke-linecap", "round");
    gearPath.setAttribute("stroke-linejoin", "round");
    icon.append(circlePath, gearPath);

    return icon;
}

function createToggleButton(): HTMLButtonElement {
    const button = quickColorSwitcherRuntime.createElement("button");
    button.className = "switcher-toggle";
    button.id = "color-switcher-toggle";
    button.type = "button";
    button.dataset["tooltip"] = "Quick Colors";
    button.setAttribute("aria-label", "Open color switcher");

    const label = quickColorSwitcherRuntime.createElement("span");
    label.className = "switcher-label";
    label.textContent = "Colors";
    button.append(createPaletteIcon(), label);

    return button;
}

function createColorOption(
    preset: ColorPreset,
    currentColor: string
): HTMLButtonElement {
    const button = quickColorSwitcherRuntime.createElement("button");
    button.className = "color-option";
    if (preset.color === currentColor) {
        button.classList.add("active");
    }
    button.type = "button";
    button.dataset["color"] = preset.color;
    button.title = preset.name;
    button.style.background = preset.color;
    button.setAttribute("aria-label", `Switch to ${preset.name}`);

    const name = quickColorSwitcherRuntime.createElement("span");
    name.className = "color-name";
    name.textContent = preset.name;

    const check = quickColorSwitcherRuntime.createElement("span");
    check.className = "color-check";
    check.textContent = "✓";
    button.append(name, check);

    return button;
}

function createSwitcherDropdown(currentColor: string): HTMLDivElement {
    const dropdown = quickColorSwitcherRuntime.createElement("div");
    dropdown.className = "switcher-dropdown";
    dropdown.id = "color-switcher-dropdown";

    const header = quickColorSwitcherRuntime.createElement("div");
    header.className = "switcher-header";
    const title = quickColorSwitcherRuntime.createElement("span");
    title.className = "witty-title";
    title.textContent = "🎨 Pick Your Vibe";
    header.append(title);

    const grid = quickColorSwitcherRuntime.createElement("div");
    grid.className = "color-grid";
    for (const preset of COLOR_PRESETS) {
        grid.append(createColorOption(preset, currentColor));
    }

    const footer = quickColorSwitcherRuntime.createElement("div");
    footer.className = "switcher-footer";
    const settingsButton = quickColorSwitcherRuntime.createElement("button");
    settingsButton.className = "open-settings-btn";
    settingsButton.id = "open-full-settings";
    settingsButton.type = "button";
    settingsButton.title = "Advanced color settings";
    settingsButton.append(
        createSettingsIcon(),
        quickColorSwitcherRuntime.createTextNode("More Options")
    );
    footer.append(settingsButton);

    dropdown.append(header, grid, footer);

    return dropdown;
}

/**
 * Initializes the quick color switcher
 */
export function initQuickColorSwitcher(): void {
    // Check if already initialized
    if (quickColorSwitcherRuntime.querySelector(`#${SWITCHER_ID}`)) {
        return;
    }

    // Create and inject the switcher
    const switcher = createSwitcherElement();
    quickColorSwitcherRuntime.appendToBody(switcher);

    // Inject styles
    injectSwitcherStyles();

    // Setup event listeners
    setupSwitcherListeners(switcher);
}

/**
 * Updates the active color in the switcher
 *
 * @param color - The new active color
 */
export function updateSwitcherActiveColor(color: string): void {
    const switcher =
        quickColorSwitcherRuntime.querySelector(`#${SWITCHER_ID}`);
    if (!switcher) return;

    const colorOptions =
        switcher.querySelectorAll<HTMLButtonElement>(".color-option");
    for (const option of colorOptions) {
        option.classList.toggle("active", option.dataset["color"] === color);
    }
}

function createSwitcherElement(): HTMLDivElement {
    const switcher = quickColorSwitcherRuntime.createElement("div");
    switcher.id = SWITCHER_ID;
    switcher.className = "quick-color-switcher";

    const currentTheme = loadTheme();
    const effectiveTheme = getEffectiveTheme(currentTheme);
    const currentColor = getEffectiveAccentColor(effectiveTheme);

    switcher.append(createToggleButton(), createSwitcherDropdown(currentColor));

    return switcher;
}

function injectSwitcherStyles(): void {
    if (quickColorSwitcherRuntime.querySelector("#quick-color-switcher-styles")) {
        return;
    }

    const style = quickColorSwitcherRuntime.createElement("style");
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

			.switcher-dropdown {
				width: 280px;
			}

			.color-grid {
				grid-template-columns: repeat(2, 1fr);
				gap: 8px;
			}
		}
	`;

    quickColorSwitcherRuntime.appendToHead(style);
}

function cleanupSwitcherState(switcher: HTMLDivElement): void {
    const existingState = quickColorSwitcherStates.get(switcher);
    if (!existingState) {
        return;
    }

    existingState.listenerController.abort();
    if (existingState.closeTimer) {
        quickColorSwitcherRuntime.clearTimeout(existingState.closeTimer);
    }
    quickColorSwitcherStates.delete(switcher);
    trackedQuickColorSwitcherElements.delete(switcher);
}

export function resetQuickColorSwitcherStateForTests(): void {
    for (const switcher of trackedQuickColorSwitcherElements) {
        cleanupSwitcherState(switcher);
    }
    trackedQuickColorSwitcherElements.clear();
}

function setupSwitcherListeners(switcher: HTMLDivElement): void {
    cleanupSwitcherState(switcher);

    const listenerController =
        quickColorSwitcherRuntime.createAbortController();
    const state: QuickColorSwitcherState = {
        closeTimer: null,
        listenerController,
    };
    quickColorSwitcherStates.set(switcher, state);
    trackedQuickColorSwitcherElements.add(switcher);

    const toggle = switcher.querySelector<HTMLButtonElement>(
        "#color-switcher-toggle"
    );
    const dropdown = switcher.querySelector<HTMLElement>(
        "#color-switcher-dropdown"
    );
    const colorOptions =
        switcher.querySelectorAll<HTMLButtonElement>(".color-option");
    const settingsBtn = switcher.querySelector<HTMLButtonElement>(
        "#open-full-settings"
    );

    if (toggle) {
        toggle.addEventListener(
            "click",
            (e) => {
                e.stopPropagation();
                dropdown?.classList.toggle("open");
            },
            { signal: listenerController.signal }
        );
    }

    // Close dropdown when clicking outside
    quickColorSwitcherRuntime.addDocumentClickListener(
        (e) => {
            if (
                quickColorSwitcherRuntime.isNode(e.target) &&
                !switcher.contains(e.target)
            ) {
                dropdown?.classList.remove("open");
            }
        },
        { signal: listenerController.signal }
    );

    // Color option click
    for (const option of colorOptions) {
        option.addEventListener(
            "click",
            () => {
                const color = option.dataset["color"];
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
                    if (state.closeTimer) {
                        quickColorSwitcherRuntime.clearTimeout(
                            state.closeTimer
                        );
                    }
                    state.closeTimer = quickColorSwitcherRuntime.setTimeout(
                        () => {
                            state.closeTimer = null;
                            dropdown?.classList.remove("open");
                        },
                        SWITCHER_CLOSE_DELAY_MS
                    );
                }
            },
            { signal: listenerController.signal }
        );
    }

    // Open full settings modal
    if (settingsBtn) {
        settingsBtn.addEventListener(
            "click",
            () => {
                void openSettingsModal(dropdown);
            },
            { signal: listenerController.signal }
        );
    }
}

async function openSettingsModal(dropdown: HTMLElement | null): Promise<void> {
    dropdown?.classList.remove("open");
    const { showSettingsModal } = await import("./settingsModal.js");
    await showSettingsModal();
}
