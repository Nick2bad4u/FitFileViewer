import { getThemeConfig } from "../../theming/core/theme.js";
import { createIconElement } from "../../ui/icons/iconMappings.js";
import {
    isChartFullscreenActive,
    subscribeToChartFullscreen,
    toggleChartFullscreen,
} from "../fullscreen/chartFullscreenManager.js";

const wrapperCleanupRegistry = new WeakMap();
let stylesInjected = false;

/**
 * Enhance all chart canvases inside the provided container with rich hover effects.
 * @param {HTMLElement | null} chartContainer
 * @param {{ colors?: Record<string, string> }} [themeConfig]
 */
export function addChartHoverEffects(chartContainer, themeConfig) {
    if (!(chartContainer instanceof HTMLElement)) {
        console.warn("[ChartHoverEffects] Unable to enhance charts – container not found");
        return;
    }

    const canvases = chartContainer.querySelectorAll(".chart-canvas");
    if (canvases.length === 0) {
        return;
    }

    const baseTheme = themeConfig && typeof themeConfig === "object" ? themeConfig : getThemeConfig();
    const appliedTheme = baseTheme && typeof baseTheme.colors === "object" ? baseTheme : { colors: {} };

    let processedCount = 0;
    for (const canvas of canvases) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            continue;
        }
        if (canvas.dataset.hoverEffectsAdded === "true") {
            continue;
        }
        try {
            enhanceChartCanvas(canvas, appliedTheme);
            processedCount += 1;
        } catch (error) {
            console.error("[ChartHoverEffects] Failed to enhance chart", error);
        }
    }

    if (processedCount > 0) {
        ensureHoverStylesInjected();
        console.log(`[ChartHoverEffects] Added hover effects to ${processedCount} chart(s)`);
    }
}

/**
 * Convenience helper to enhance the default chart container on demand.
 */
export function addHoverEffectsToExistingCharts() {
    const chartContainer = document.querySelector("#chartjs-chart-container");
    if (!chartContainer) {
        console.warn("[ChartHoverEffects] Chart container not found");
        return;
    }
    addChartHoverEffects(chartContainer, getThemeConfig());
}

/**
 * Remove hover effects and restore canvases to their original wrapper-less layout.
 * @param {HTMLElement | null} chartContainer
 */
export function removeChartHoverEffects(chartContainer) {
    if (!(chartContainer instanceof HTMLElement)) {
        return;
    }

    const wrappers = chartContainer.querySelectorAll(".chart-wrapper");
    const theme = getThemeConfig();
    const colors = (theme && theme.colors) || {};

    for (const wrapper of wrappers) {
        const cleanupFns = wrapperCleanupRegistry.get(wrapper);
        if (cleanupFns) {
            for (const fn of cleanupFns) {
                try {
                    fn();
                } catch (error) {
                    console.warn("[ChartHoverEffects] cleanup error", error);
                }
            }
            wrapperCleanupRegistry.delete(wrapper);
        }

        const canvas = wrapper.querySelector(".chart-canvas");
        if (canvas instanceof HTMLCanvasElement) {
            if (canvas.parentNode === wrapper && wrapper.parentNode instanceof HTMLElement) {
                wrapper.parentNode.insertBefore(canvas, wrapper);
            }
            canvas.dataset.hoverEffectsAdded = "false";
            if (canvas.style) {
                canvas.style.border = "";
                canvas.style.boxShadow = `0 2px 8px ${colors.shadowLight || "#00000055"}`;
                canvas.style.margin = "";
                canvas.style.marginBottom = "20px";
                canvas.style.borderRadius = "8px";
                canvas.style.display = "";
                canvas.style.width = "100%";
                canvas.style.maxWidth = "";
                canvas.style.height = "400px";
                canvas.style.maxHeight = "400px";
                canvas.style.position = "";
                canvas.style.boxSizing = "";
            }
        }

        wrapper.remove();
    }
}

function applyThemeTokens(context, colors) {
    const {
        wrapper,
        toolbar,
        legendBtn,
        legendIcon,
        fullscreenBtn,
        fullscreenIcon,
        glowOverlay,
        titleOverlay,
        axisXLabel,
        axisYLabel,
        titleAccent,
        axisTextColor,
        xAccent,
        yAccent,
    } = context;

    wrapper.style.background = colors.surface || "#222";
    wrapper.style.borderColor = colors.border || "#444";
    wrapper.style.boxShadow = `0 4px 20px ${colors.shadowLight || "#00000055"}, 0 2px 8px ${colors.primaryShadowLight || "#00000033"}`;

    toolbar.style.background = colors.surfaceSecondary || colors.surface || "#2d3240";
    toolbar.style.borderColor = colors.border || "#3b3f4a";
    toolbar.style.color = colors.text || colors.textPrimary || "#f8fafc";

    const passiveIconColor = colors.textSecondary || colors.text || colors.textPrimary || "#f8fafc";
    if (legendIcon) {
        const isActive = legendBtn.classList.contains("is-active");
        legendIcon.style.color = isActive ? titleAccent : passiveIconColor;
    }
    if (fullscreenIcon) {
        const isActive = fullscreenBtn.classList.contains("is-active");
        fullscreenIcon.style.color = isActive ? titleAccent : passiveIconColor;
    }

    if (glowOverlay) {
        glowOverlay.style.background = `linear-gradient(45deg, ${titleAccent}, ${colors.accent || titleAccent}, ${titleAccent})`;
    }
    if (titleOverlay) {
        titleOverlay.style.background = colors.surfaceSecondary || colors.surface || "#333";
        titleOverlay.style.color = axisTextColor;
        titleOverlay.style.boxShadow = `0 4px 12px ${colors.shadowLight || "#00000055"}`;
    }
    if (axisXLabel) {
        axisXLabel.style.color = axisTextColor;
        axisXLabel.style.textShadow = `0 1px 2px ${colors.shadowLight || "#00000055"}`;
        const iconEl = axisXLabel.querySelector("iconify-icon");
        if (iconEl) {
            iconEl.style.color = xAccent;
        }
    }
    if (axisYLabel) {
        axisYLabel.style.color = axisTextColor;
        axisYLabel.style.textShadow = `0 1px 2px ${colors.shadowLight || "#00000055"}`;
        const iconEl = axisYLabel.querySelector("iconify-icon");
        if (iconEl) {
            iconEl.style.color = yAccent;
        }
    }
}

function createAxisLabel(axis, text, iconName) {
    const label = document.createElement("div");
    label.className = `chart-axis-label chart-axis-label-${axis}`;
    label.setAttribute("aria-hidden", "true");
    if (iconName) {
        const icon = createIconElement(iconName, 20);
        icon.classList.add("chart-axis-label__icon");
        label.append(icon);
    }
    const textNode = document.createElement("span");
    textNode.textContent = text;
    if (axis === "y") {
        textNode.style.writingMode = "vertical-rl";
        textNode.style.textOrientation = "mixed";
        textNode.style.letterSpacing = "0.1em";
    }
    label.append(textNode);
    return label;
}

function createGlowOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "chart-glow-overlay";
    return overlay;
}

function createTitleOverlay(titleText, iconName) {
    const overlay = document.createElement("div");
    overlay.className = "chart-title-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const content = document.createElement("div");
    content.className = "chart-title-overlay__content";
    if (iconName) {
        const icon = createIconElement(iconName, 22);
        icon.classList.add("chart-title-overlay__icon");
        content.append(icon);
    }
    const textNode = document.createElement("span");
    textNode.textContent = titleText;
    content.append(textNode);
    overlay.append(content);
    return overlay;
}

function createToolbarButton(icon, title) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chart-action-btn";
    button.title = title;
    button.setAttribute("aria-label", title);

    const iconEl = document.createElement("iconify-icon");
    iconEl.setAttribute("icon", icon);
    iconEl.setAttribute("width", "18");
    iconEl.setAttribute("height", "18");
    iconEl.setAttribute("aria-hidden", "true");
    iconEl.classList.add("chart-action-btn__icon");
    iconEl.style.color = "currentColor";

    button.append(iconEl);
    return button;
}

function enhanceChartCanvas(canvas, themeConfig) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("chart-wrapper");

    const cleanupFns = [];
    wrapperCleanupRegistry.set(wrapper, cleanupFns);

    const originalParent = canvas.parentElement;
    if (originalParent) {
        canvas.before(wrapper);
    }
    wrapper.append(canvas);

    if (canvas.style) {
        canvas.style.border = "none";
        canvas.style.boxShadow = "none";
        canvas.style.margin = "0";
        canvas.style.marginBottom = "0";
        canvas.style.borderRadius = "8px";
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.maxWidth = "100%";
        canvas.style.height = "400px";
        canvas.style.maxHeight = "400px";
        canvas.style.position = "relative";
        canvas.style.boxSizing = "border-box";
    }

    const toolbar = document.createElement("div");
    toolbar.classList.add("chart-action-toolbar");
    wrapper.append(toolbar);

    const legendBtn = createToolbarButton("mdi:format-list-bulleted", "Toggle legend visibility");
    const resetBtn = createToolbarButton("mdi:magnify-remove-outline", "Reset zoom");
    resetBtn.title = "Reset zoom (Shift + drag to zoom)";
    resetBtn.setAttribute("aria-label", resetBtn.title);
    const fullscreenBtn = createToolbarButton("mdi:fullscreen", "View chart fullscreen");

    toolbar.append(legendBtn, resetBtn, fullscreenBtn);

    const glowOverlay = createGlowOverlay();
    wrapper.append(glowOverlay);

    const datasetAttrs = canvas.dataset || {};
    const rawTitle = (canvas.getAttribute("aria-label") || datasetAttrs.chartTitleText || "Chart").trim();
    const normalizedTitle = rawTitle.replace(/chart for /i, "").trim() || "Chart";
    const displayTitle = normalizedTitle.toUpperCase();

    const titleOverlay = createTitleOverlay(displayTitle, datasetAttrs.chartTitleIcon);
    wrapper.append(titleOverlay);

    let axisXLabel;
    if (datasetAttrs.chartXAxisText) {
        axisXLabel = createAxisLabel("x", datasetAttrs.chartXAxisText, datasetAttrs.chartXAxisIcon);
        wrapper.append(axisXLabel);
    }
    let axisYLabel;
    if (datasetAttrs.chartYAxisText) {
        axisYLabel = createAxisLabel("y", datasetAttrs.chartYAxisText, datasetAttrs.chartYAxisIcon);
        wrapper.append(axisYLabel);
    }

    const colors = themeConfig.colors ? { ...themeConfig.colors } : {};
    const titleAccent = datasetAttrs.chartTitleColor || colors.accent || colors.primary || "#3b82f6";
    const axisTextColor = datasetAttrs.chartAxisColor || colors.textPrimary || "#f8fafc";
    const xAccent = datasetAttrs.chartXAxisColor || titleAccent;
    const yAccent = datasetAttrs.chartYAxisColor || titleAccent;

    const context = {
        wrapper,
        canvas,
        toolbar,
        legendBtn,
        legendIcon: legendBtn.querySelector("iconify-icon"),
        resetBtn,
        fullscreenBtn,
        fullscreenIcon: fullscreenBtn.querySelector("iconify-icon"),
        glowOverlay,
        titleOverlay,
        axisXLabel,
        axisYLabel,
        titleAccent,
        axisTextColor,
        xAccent,
        yAccent,
        colors,
        datasetAttrs,
        displayTitle,
        cleanupFns,
    };

    setupLegendControls(context);
    setupResetZoom(context);
    setupFullscreenControls(context, displayTitle);
    setupHoverState(context);
    setupRippleEffect(context);

    applyThemeTokens(context, colors);
    registerThemeListener(context);

    canvas.dataset.hoverEffectsAdded = "true";
}

function ensureHoverStylesInjected() {
    if (stylesInjected) {
        const existing = document.getElementById("chart-hover-effects-styles");
        if (existing) {
            return;
        }
        stylesInjected = false;
    }
    if (document.getElementById("chart-hover-effects-styles")) {
        return;
    }
    const style = document.createElement("style");
    style.id = "chart-hover-effects-styles";
    style.textContent = `
		.chart-wrapper {
			position: relative;
			margin-bottom: 32px;
			border-radius: 16px;
			padding: 32px 32px 72px 72px;
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			overflow: visible;
			box-sizing: border-box;
			cursor: pointer;
		}

		.chart-wrapper--hovered {
			transform: translateY(-6px) scale(1.02);
		}

		.chart-action-toolbar {
			position: absolute;
			top: 20px;
			right: 24px;
			display: flex;
			gap: 8px;
			align-items: center;
			padding: 6px 10px;
			border-radius: 999px;
			box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
			backdrop-filter: blur(8px);
			z-index: 12;
			transition: transform 0.2s ease, box-shadow 0.2s ease;
		}

		.chart-action-btn {
			border: 0;
			background: transparent;
			color: inherit;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			border-radius: 999px;
			cursor: pointer;
			transition: background-color 0.2s ease, transform 0.2s ease;
		}

		.chart-action-btn:hover {
			background-color: rgba(255, 255, 255, 0.12);
			transform: translateY(-1px);
		}

		.chart-action-btn.is-active {
			background-color: rgba(59, 130, 246, 0.18);
			box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.45) inset;
		}

		.chart-action-btn__icon {
			pointer-events: none;
		}

		.chart-glow-overlay {
			position: absolute;
			top: -2px;
			left: -2px;
			right: -2px;
			bottom: -2px;
			border-radius: 14px;
			opacity: 0;
			z-index: -1;
			transition: opacity 0.4s ease;
			pointer-events: none;
		}

		.chart-wrapper--hovered .chart-glow-overlay {
			opacity: 0.35;
		}

		.chart-title-overlay {
			position: absolute;
			top: 16px;
			left: 32px;
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 6px 16px;
			border-radius: 999px;
			font-size: 14px;
			font-weight: 600;
			opacity: 0;
			transform: translateY(0);
			transition: all 0.3s ease;
			z-index: 12;
			pointer-events: none;
		}

		.chart-wrapper--hovered .chart-title-overlay {
			opacity: 1;
		}

		.chart-title-overlay__content {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.chart-axis-label {
			position: absolute;
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 13px;
			font-weight: 600;
			pointer-events: none;
			opacity: 0.85;
			z-index: 6;
		}

		.chart-axis-label-x {
			bottom: 24px;
			left: 50%;
			transform: translateX(-50%);
		}

		.chart-axis-label-y {
			left: 32px;
			top: 50%;
			transform: translateY(-50%);
			flex-direction: column;
		}

		.chart-ripple {
			position: absolute;
			border-radius: 50%;
			transform: scale(0);
			animation: chart-ripple-effect 0.6s ease-out;
			pointer-events: none;
			z-index: 5;
		}

		@keyframes chart-ripple-effect {
			to {
				transform: scale(2);
				opacity: 0;
			}
		}
	`;
    document.head.append(style);
    stylesInjected = true;
}

function getChartInstance(canvas) {
    const chartGlobal = /** @type {any} */ (globalThis).Chart;
    if (!chartGlobal) {
        return null;
    }
    if (typeof chartGlobal.getChart === "function") {
        return chartGlobal.getChart(canvas) || null;
    }
    return /** @type {any} */ (canvas)?.chart || null;
}

function registerThemeListener(context) {
    const handler = () => {
        const nextTheme = getThemeConfig();
        const nextColors = (nextTheme && nextTheme.colors) || {};
        context.colors = { ...nextColors };
        const attrs = context.datasetAttrs || {};
        const nextTitleAccent = attrs.chartTitleColor || nextColors.accent || nextColors.primary || context.titleAccent;
        context.titleAccent = nextTitleAccent;
        context.axisTextColor = attrs.chartAxisColor || nextColors.textPrimary || nextColors.text || context.axisTextColor;
        context.xAccent = attrs.chartXAxisColor || nextTitleAccent;
        context.yAccent = attrs.chartYAxisColor || nextTitleAccent;
        applyThemeTokens(context, context.colors);
        updateLegendIconColor(context);
        context.syncLegendState?.();
        context.refreshFullscreenState?.();
    };
    document.body.addEventListener("themechange", handler);
    context.cleanupFns.push(() => document.body.removeEventListener("themechange", handler));
}

function setupFullscreenControls(context, displayTitle) {
    const { fullscreenBtn, fullscreenIcon, wrapper, cleanupFns } = context;

    const setFullscreenActive = (isActive) => {
        const { titleAccent } = context;
        const colors = context.colors || {};
        fullscreenBtn.classList.toggle("is-active", isActive);
        if (fullscreenIcon) {
            fullscreenIcon.setAttribute("icon", isActive ? "mdi:fullscreen-exit" : "mdi:fullscreen");
            const passive = colors.textSecondary || colors.text || "#f8fafc";
            fullscreenIcon.style.color = isActive ? titleAccent : passive;
        }
    };

    const clickHandler = (event) => {
        event.stopPropagation();
        toggleChartFullscreen(wrapper, {
            title: displayTitle,
        });
    };
    fullscreenBtn.addEventListener("click", clickHandler);
    cleanupFns.push(() => fullscreenBtn.removeEventListener("click", clickHandler));

    const unsubscribe = subscribeToChartFullscreen(({ active, wrapper: activeWrapper }) => {
        setFullscreenActive(active && activeWrapper === wrapper);
    });
    cleanupFns.push(unsubscribe);

    context.refreshFullscreenState = () => setFullscreenActive(isChartFullscreenActive(wrapper));
    context.refreshFullscreenState();
}

function setupHoverState(context) {
    const { wrapper, cleanupFns } = context;
    const onEnter = () => wrapper.classList.add("chart-wrapper--hovered");
    const onLeave = () => wrapper.classList.remove("chart-wrapper--hovered");
    wrapper.addEventListener("mouseenter", onEnter);
    wrapper.addEventListener("mouseleave", onLeave);
    cleanupFns.push(() => {
        wrapper.removeEventListener("mouseenter", onEnter);
        wrapper.removeEventListener("mouseleave", onLeave);
    });
}

function setupLegendControls(context) {
    const { legendBtn, canvas, cleanupFns } = context;

    const syncLegendState = () => {
        const chart = getChartInstance(canvas);
        if (!chart?.options?.plugins?.legend) {
            return;
        }
        const legendOptions = chart.options.plugins.legend;
        const isActive = legendOptions.display !== false;
        legendBtn.classList.toggle("is-active", isActive);
        updateLegendIconColor(context);
    };

    const clickHandler = (event) => {
        event.stopPropagation();
        const chart = getChartInstance(canvas);
        if (!chart?.options?.plugins?.legend) {
            return;
        }
        const legendOptions = chart.options.plugins.legend;
        legendOptions.display = !legendOptions.display;
        syncLegendState();
        chart.update();
    };
    legendBtn.addEventListener("click", clickHandler);
    cleanupFns.push(() => legendBtn.removeEventListener("click", clickHandler));

    const chart = getChartInstance(canvas);
    if (chart?.options?.plugins?.legend) {
        const legendOptions = chart.options.plugins.legend;
        if (!legendOptions.__ffvToolbarHooked) {
            const originalOnClick = legendOptions.onClick;
            legendOptions.onClick = function (...args) {
                if (typeof originalOnClick === "function") {
                    originalOnClick.apply(this, args);
                } else {
                    const [, legendItem] = args;
                    if (legendItem && typeof legendItem.datasetIndex === "number") {
                        chart.toggleDatasetVisibility(legendItem.datasetIndex);
                        chart.update();
                    }
                }
                requestAnimationFrame(syncLegendState);
            };
            legendOptions.__ffvToolbarHooked = true;
        }
    }

    context.syncLegendState = syncLegendState;
    syncLegendState();
}

function setupResetZoom(context) {
    const { resetBtn, canvas, cleanupFns } = context;

    const handler = (event) => {
        event.stopPropagation();
        const chart = getChartInstance(canvas);
        if (chart?.resetZoom) {
            chart.resetZoom();
        }
    };
    resetBtn.addEventListener("click", handler);
    cleanupFns.push(() => resetBtn.removeEventListener("click", handler));
}

function setupRippleEffect(context) {
    const { wrapper, titleAccent, cleanupFns } = context;
    const handler = (event) => {
        const rect = wrapper.getBoundingClientRect();
        const ripple = document.createElement("div");
        ripple.className = "chart-ripple";
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.background = `radial-gradient(circle, ${withAlpha(titleAccent, 0.25, "rgba(59,130,246,0.25)")}, transparent)`;
        wrapper.append(ripple);
        setTimeout(() => ripple.remove(), 600);
    };
    wrapper.addEventListener("click", handler);
    cleanupFns.push(() => wrapper.removeEventListener("click", handler));
}

function updateLegendIconColor(context) {
    const { legendBtn, legendIcon, titleAccent } = context;
    if (!legendIcon) {
        return;
    }
    const colors = context.colors || {};
    const passive = colors.textSecondary || colors.text || colors.textPrimary || "#f8fafc";
    legendIcon.style.color = legendBtn.classList.contains("is-active") ? titleAccent : passive;
}

function withAlpha(color, alpha, fallback) {
    if (typeof color !== "string") {
        return fallback;
    }
    const trimmed = color.trim();
    const hexMatch = trimmed.match(/^#([\da-f]{3}|[\da-f]{6})$/iu);
    if (hexMatch) {
        let [hex] = hexMatch.slice(1);
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((ch) => ch + ch)
                .join("");
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (trimmed.startsWith("rgba(")) {
        return trimmed.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/u, `rgba($1,$2,$3,${alpha})`);
    }
    if (trimmed.startsWith("rgb(")) {
        const parts = trimmed
            .slice(4, -1)
            .split(",")
            .map((part) => part.trim())
            .join(", ");
        return `rgba(${parts}, ${alpha})`;
    }
    return fallback;
}
