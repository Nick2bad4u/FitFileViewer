import { getThemeConfig } from "../../theming/core/theme.js";
import { createIconElement } from "../../ui/icons/iconMappings.js";

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
