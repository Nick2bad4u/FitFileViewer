import { getThemeConfig } from "../../theming/core/theme.js";
import { createIconElement } from "../../ui/icons/iconMappings.js";

const wrapperCleanupRegistry = new WeakMap();

/**
 * Adds fancy hover effects to chart canvases to match the info box styling
 * @param {HTMLElement} chartContainer - Container with chart canvases
 * @param {Object} themeConfig - Theme configuration object
 */
/**
 * @param {HTMLElement} chartContainer
 * @param {{ colors: { [k:string]: string, border?:string, surface?:string, shadowLight?:string, primaryShadowLight?:string, primary?:string, accent?:string, textPrimary?:string, shadow?:string, primaryShadowHeavy?:string, surfaceSecondary?:string } }} themeConfig
 */
export function addChartHoverEffects(chartContainer, themeConfig) {
    if (!chartContainer || !themeConfig) {
        console.warn("[ChartHoverEffects] Missing required parameters");
        return;
    }

    const chartCanvases = chartContainer.querySelectorAll(".chart-canvas");
    let processedCount = 0;

    for (const canvas of chartCanvases) {
        if (!(canvas instanceof HTMLElement)) {
            continue;
        }

        if (canvas.dataset?.hoverEffectsAdded) {
            continue;
        }

        if (canvas.dataset) {
            canvas.dataset.hoverEffectsAdded = "true";
        }

        const wrapper = document.createElement("div");
        wrapper.className = "chart-wrapper";
        const colors = /** @type {any} */ (themeConfig.colors || {});
        const cleanupFns = [];
        wrapperCleanupRegistry.set(wrapper, cleanupFns);
        wrapper.style.cssText = `
            position: relative;
            margin-bottom: 32px;
            border-radius: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: visible;
            border: 2px solid ${colors.border || "#444"};
            background: ${colors.surface || "#222"};
            padding: 32px 32px 72px 72px;
            box-shadow: 0 4px 20px ${colors.shadowLight || "#00000055"},
                        0 2px 8px ${colors.primaryShadowLight || "#00000033"};
            box-sizing: border-box;
        `;

        if (canvas.parentNode instanceof HTMLElement) {
            canvas.parentNode.insertBefore(wrapper, canvas);
        }
        wrapper.append(canvas);

        const toolbar = document.createElement("div");
        toolbar.className = "chart-action-toolbar";
        toolbar.style.background = colors.surfaceSecondary || colors.surface || "#2d3240";
        toolbar.style.borderColor = colors.border || "#3b3f4a";
        toolbar.style.color = colors.text || colors.textPrimary || "#f8fafc";
        wrapper.append(toolbar);

        const legendBtn = createToolbarButton("mdi:format-list-bulleted", "Toggle legend visibility", colors);
        const legendIcon = legendBtn.querySelector("iconify-icon");
        legendBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            const chart = getChartInstance(/** @type {HTMLCanvasElement} */(canvas));
            if (!chart?.options?.plugins?.legend) {
                return;
            }
            const legendOptions = chart.options.plugins.legend;
            legendOptions.display = !legendOptions.display;
            legendBtn.classList.toggle("is-active", Boolean(legendOptions.display));
            chart.update();
        });
        const syncLegendState = () => {
            const chart = getChartInstance(/** @type {HTMLCanvasElement} */(canvas));
            if (!chart?.options?.plugins?.legend) {
                return;
            }
            const legendOptions = /** @type {any} */ (chart.options.plugins.legend);
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
            const legendVisible = legendOptions.display !== false;
            legendBtn.classList.toggle("is-active", legendVisible);
            if (legendIcon) {
                const fallbackColor = colors?.textSecondary || colors?.text || "";
                const activeColor = colors?.accent || fallbackColor;
                legendIcon.style.color = legendVisible ? activeColor : fallbackColor;
            }
        };
        requestAnimationFrame(syncLegendState);

        const resetZoomBtn = createToolbarButton("mdi:magnify-remove-outline", "Reset zoom", colors);
        resetZoomBtn.title = "Reset zoom (Shift + drag to zoom)";
        resetZoomBtn.setAttribute("aria-label", resetZoomBtn.title);
        resetZoomBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            const chart = getChartInstance(/** @type {HTMLCanvasElement} */(canvas));
            if (chart?.resetZoom) {
                chart.resetZoom();
            }
        });

        const fullscreenBtn = createToolbarButton("mdi:fullscreen", "View chart fullscreen", colors);
        const fullscreenIcon = fullscreenBtn.querySelector("iconify-icon");
        const updateFullscreenState = () => {
            const isActive = document.fullscreenElement === wrapper;
            fullscreenBtn.classList.toggle("is-active", isActive);
            if (fullscreenIcon) {
                fullscreenIcon.setAttribute("icon", isActive ? "mdi:fullscreen-exit" : "mdi:fullscreen");
                const fallbackColor = colors?.textSecondary || colors?.text || "";
                const activeColor = colors?.accent || fallbackColor;
                fullscreenIcon.style.color = isActive ? activeColor : fallbackColor;
            }
            fullscreenBtn.title = isActive ? "Exit fullscreen" : "View chart fullscreen";
            fullscreenBtn.setAttribute("aria-label", fullscreenBtn.title);
        };

        fullscreenBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            if (document.fullscreenElement === wrapper) {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {
                        /* ignore */
                    });
                }
                return;
            }
            const target = /** @type {any} */ (wrapper);
            const requestFullscreen =
                target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
            if (typeof requestFullscreen === "function") {
                Promise.resolve()
                    .then(() => requestFullscreen.call(target))
                    .catch(() => {
                        /* ignore */
                    });
            }
        });

        const fullscreenListener = () => updateFullscreenState();
        document.addEventListener("fullscreenchange", fullscreenListener);
        cleanupFns.push(() => document.removeEventListener("fullscreenchange", fullscreenListener));
        updateFullscreenState();

        toolbar.append(legendBtn);
        toolbar.append(resetZoomBtn);
        toolbar.append(fullscreenBtn);

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

        const datasetAttrs = canvas.dataset || {};
        const rawTitle = (canvas.getAttribute("aria-label") || "Chart").trim();
        const fallbackTitle =
            datasetAttrs.chartTitleText || rawTitle.replace(/chart for /i, "").trim() || rawTitle.trim() || "Chart";
        const normalizedTitle = fallbackTitle.trim() || "Chart";
        const displayTitle = normalizedTitle.toUpperCase();
        const titleIconName = datasetAttrs.chartTitleIcon;
        const titleAccent = datasetAttrs.chartTitleColor || colors.accent || colors.primary || "#3b82f6";
        const axisTextColor = colors.textPrimary || "#fff";
        const xLabelText = datasetAttrs.chartXAxisText || "";
        const xIconName = datasetAttrs.chartXAxisIcon;
        const xAccent = datasetAttrs.chartXAxisColor || titleAccent;
        const yLabelText = datasetAttrs.chartYAxisText || "";
        const yIconName = datasetAttrs.chartYAxisIcon;
        const yAccent = datasetAttrs.chartYAxisColor || titleAccent;

        const glowOverlay = document.createElement("div");
        glowOverlay.className = "chart-glow-overlay";
        glowOverlay.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, ${titleAccent}, ${colors.accent || titleAccent}, ${titleAccent});
            border-radius: 14px;
            opacity: 0;
            z-index: -1;
            transition: opacity 0.4s ease;
            pointer-events: none;
        `;
        wrapper.append(glowOverlay);

        const titleOverlay = document.createElement("div");
        titleOverlay.className = "chart-title-overlay";
        titleOverlay.style.cssText = `
            position: absolute;
            top: 16px;
            left: 32px;
            display: flex;
            align-items: center;
            gap: 10px;
            background: ${colors.surfaceSecondary || colors.surface || "#333"};
            color: ${axisTextColor};
            padding: 6px 16px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 600;
            opacity: 0;
            transform: translateY(0);
            transition: all 0.3s ease;
            z-index: 12;
            pointer-events: none;
            box-shadow: 0 4px 12px ${colors.shadowLight || "#00000055"};
        `;
        titleOverlay.setAttribute("aria-hidden", "true");
        const titleContent = document.createElement("div");
        titleContent.style.cssText = "display:flex; align-items:center; gap:8px;";
        if (titleIconName) {
            const titleIcon = createIconElement(titleIconName, 22);
            titleIcon.style.color = titleAccent;
            titleContent.append(titleIcon);
        }
        const titleSpan = document.createElement("span");
        titleSpan.textContent = displayTitle;
        titleContent.append(titleSpan);
        titleOverlay.append(titleContent);
        wrapper.append(titleOverlay);

        let axisXLabel;
        if (xLabelText) {
            axisXLabel = document.createElement("div");
            axisXLabel.className = "chart-axis-label chart-axis-label-x";
            axisXLabel.setAttribute("aria-hidden", "true");
            axisXLabel.style.cssText = `
                position: absolute;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                font-weight: 600;
                color: ${axisTextColor};
                pointer-events: none;
                opacity: 0.85;
                z-index: 6;
                text-shadow: 0 1px 2px ${colors.shadowLight || "#00000055"};
            `;
            if (xIconName) {
                const xIcon = createIconElement(xIconName, 20);
                xIcon.style.color = xAccent;
                axisXLabel.append(xIcon);
            }
            const xText = document.createElement("span");
            xText.textContent = xLabelText;
            axisXLabel.append(xText);
            wrapper.append(axisXLabel);
        }

        let axisYLabel;
        if (yLabelText) {
            axisYLabel = document.createElement("div");
            axisYLabel.className = "chart-axis-label chart-axis-label-y";
            axisYLabel.setAttribute("aria-hidden", "true");
            axisYLabel.style.cssText = `
                position: absolute;
                left: 32px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                font-weight: 600;
                color: ${axisTextColor};
                pointer-events: none;
                opacity: 0.85;
                z-index: 6;
                text-shadow: 0 1px 2px ${colors.shadowLight || "#00000055"};
            `;
            if (yIconName) {
                const yIcon = createIconElement(yIconName, 20);
                yIcon.style.color = yAccent;
                axisYLabel.append(yIcon);
            }
            const yText = document.createElement("span");
            yText.textContent = yLabelText;
            yText.style.writingMode = "vertical-rl";
            yText.style.textOrientation = "mixed";
            yText.style.letterSpacing = "0.1em";
            axisYLabel.append(yText);
            wrapper.append(axisYLabel);
        }

        wrapper.addEventListener("mouseenter", () => {
            wrapper.style.transform = "translateY(-6px) scale(1.02)";
            wrapper.style.boxShadow = `0 12px 40px ${colors.shadow || "#00000088"},
                                       0 8px 20px ${colors.primaryShadowHeavy || "#00000055"}`;
            wrapper.style.borderColor = titleAccent;

            glowOverlay.style.opacity = "0.35";
            titleOverlay.style.opacity = "1";
            titleOverlay.style.transform = "translateY(0)";
            if (axisXLabel) {
                axisXLabel.style.opacity = "1";
            }
            if (axisYLabel) {
                axisYLabel.style.opacity = "1";
            }

            wrapper.style.background = `linear-gradient(135deg, ${colors.surface || "#222"} 0%, ${colors.surfaceSecondary || colors.surface || "#222"} 100%)`;
        });

        wrapper.addEventListener("mouseleave", () => {
            wrapper.style.transform = "translateY(0) scale(1)";
            wrapper.style.boxShadow = `0 4px 20px ${colors.shadowLight || "#00000055"},
                                       0 2px 8px ${colors.primaryShadowLight || "#00000033"}`;
            wrapper.style.borderColor = colors.border || "";

            glowOverlay.style.opacity = "0";
            titleOverlay.style.opacity = "0";
            titleOverlay.style.transform = "translateY(0)";
            if (axisXLabel) {
                axisXLabel.style.opacity = "0.85";
            }
            if (axisYLabel) {
                axisYLabel.style.opacity = "0.85";
            }

            wrapper.style.background = colors.surface || "#222";
        });

        wrapper.addEventListener("click", (e) => {
            const rect = wrapper.getBoundingClientRect();
            const ripple = document.createElement("div");
            ripple.className = "chart-ripple";
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: radial-gradient(circle, ${titleAccent}40, transparent);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-effect 0.6s ease-out;
                pointer-events: none;
                z-index: 5;
            `;

            wrapper.append(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });

        processedCount += 1;
        console.log(`[ChartHoverEffects] Added hover effects to chart: ${rawTitle}`);
    }

    if (!document.querySelector("#chart-hover-effects-styles")) {
        const style = document.createElement("style");
        style.id = "chart-hover-effects-styles";
        style.textContent = `
            @keyframes ripple-effect {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }

            .chart-wrapper {
                cursor: pointer;
                box-sizing: border-box;
                width: 100%;
            }

            .chart-wrapper .chart-action-toolbar {
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

            .chart-action-btn:active {
                transform: translateY(0);
            }

            .chart-action-btn.is-active {
                background-color: rgba(59, 130, 246, 0.18);
                box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.45) inset;
            }

            .chart-action-btn__icon {
                pointer-events: none;
            }

            .chart-wrapper:hover .chart-canvas {
                filter: brightness(1.05) contrast(1.02);
            }

            .chart-wrapper:active {
                transform: translateY(-4px) scale(1.01) !important;
                transition: all 0.1s ease;
            }

            .chart-wrapper .chart-canvas {
                box-sizing: border-box;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                display: block;
            }
        `;
        document.head.append(style);
    }

    console.log(`[ChartHoverEffects] Added hover effects to ${processedCount} chart(s)`);
}

export function addHoverEffectsToExistingCharts() {
    const chartContainer = document.querySelector("#chartjs-chart-container");
    if (!chartContainer) {
        console.warn("[DevHelper] Chart container not found");
        return;
    }

    // Get theme configuration
    let themeConfig;
    if (/** @type {any} */ (globalThis).getThemeConfig) {
        // @ts-ignore legacy global
        themeConfig = /** @type {any} */ (globalThis).getThemeConfig();
    } else {
        themeConfig = getThemeConfig();
    }

    addChartHoverEffects(chartContainer, themeConfig);
    console.log("[DevHelper] Hover effects added to existing charts");
} /**
 * Development helper function to manually add hover effects to existing charts
 * This can be called from the browser console for testing
 */

/**
 * Removes hover effects from chart containers (cleanup function)
 * @param {HTMLElement} chartContainer - Container with chart canvases
 */
export function removeChartHoverEffects(chartContainer) {
    if (!chartContainer) {
        return;
    }

    const chartWrappers = chartContainer.querySelectorAll(".chart-wrapper"),
        themeConfig = /** @type {any} */ (getThemeConfig()),
        colors = /** @type {any} */ (themeConfig && themeConfig.colors ? themeConfig.colors : {});
    for (const wrapper of chartWrappers) {
        const canvas = wrapper.querySelector(".chart-canvas");
        const cleanupFns = wrapperCleanupRegistry.get(wrapper);
        if (cleanupFns && Array.isArray(cleanupFns)) {
            for (const fn of cleanupFns) {
                try {
                    fn();
                } catch (error) {
                    console.warn("[ChartHoverEffects] cleanup error", error);
                }
            }
            wrapperCleanupRegistry.delete(wrapper);
        }
        if (canvas instanceof HTMLElement && wrapper.parentNode instanceof HTMLElement) {
            // Move canvas back to original parent and remove wrapper
            wrapper.parentNode.insertBefore(canvas, wrapper);
            wrapper.remove();
            // Reset canvas styles to original createChartCanvas values
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
            if (canvas.dataset) {
                delete canvas.dataset.hoverEffectsAdded;
            }
        }
    }

    console.log(`[ChartHoverEffects] Removed hover effects from ${chartWrappers.length} chart(s)`);
}

/**
 * @param {string} icon
 * @param {string} title
 * @param {any} colors
 * @returns {HTMLButtonElement}
 */
function createToolbarButton(icon, title, colors) {
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
    const baseColor = colors?.text || colors?.textPrimary || "#f8fafc";
    iconEl.style.color = baseColor;

    button.append(iconEl);
    return button;
}

/**
 * @param {HTMLCanvasElement} canvas
 */
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
