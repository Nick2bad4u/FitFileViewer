import { getThemeConfig } from "../../theming/core/theme.js";

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

    // Find all chart canvases in the container
    const chartCanvases = chartContainer.querySelectorAll(".chart-canvas");

    for (const canvas of chartCanvases) {
        if (!(canvas instanceof HTMLElement)) {
            continue;
        }
        // Skip if hover effects already added
        if (canvas.dataset && canvas.dataset.hoverEffectsAdded) {
            continue;
        }

        // Mark as having hover effects
        if (canvas.dataset) {
            canvas.dataset.hoverEffectsAdded = "true";
        } // Create a wrapper div for the chart to handle hover effects properly
        const wrapper = document.createElement("div");
        wrapper.className = "chart-wrapper";
        const colors = /** @type {any} */ (themeConfig.colors || {});
        wrapper.style.cssText = `
            position: relative;
            margin-bottom: 24px;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            border: 2px solid ${colors.border || "#444"};
            background: ${colors.surface || "#222"};
            padding: 16px;
            box-shadow: 0 4px 20px ${colors.shadowLight || "#00000055"},
                        0 2px 8px ${colors.primaryShadowLight || "#00000033"};
            box-sizing: border-box;
        `;

        // Insert wrapper before canvas and move canvas into wrapper
        if (canvas.parentNode instanceof HTMLElement) {
            canvas.parentNode.insertBefore(wrapper, canvas);
        }
        wrapper.append(canvas); // Update canvas styles to work with wrapper - ensure it stays inside
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

        // Add animated border glow overlay
        const glowOverlay = document.createElement("div");
        glowOverlay.className = "chart-glow-overlay";
        glowOverlay.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, ${colors.primary || "#888"}, ${colors.accent || "#555"}, ${colors.primary || "#888"});
            border-radius: 14px;
            opacity: 0;
            z-index: -1;
            transition: opacity 0.4s ease;
            pointer-events: none;
        `;
        wrapper.append(glowOverlay);

        // Add chart title overlay for better visual hierarchy
        const chartTitle = canvas.getAttribute("aria-label") || "Chart",
            titleOverlay = document.createElement("div");
        titleOverlay.className = "chart-title-overlay";
        titleOverlay.style.cssText = `
            position: absolute;
            top: 8px;
            left: 16px;
            background: ${colors.primary || "#555"};
            color: ${colors.textPrimary || "#fff"};
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            opacity: 0;
            transform: translateY(-8px);
            transition: all 0.3s ease;
            z-index: 10;
            pointer-events: none;
            box-shadow: 0 2px 8px ${themeConfig.colors.shadowLight};
        `;
        titleOverlay.textContent = chartTitle.replace("Chart for ", "").toUpperCase();
        wrapper.append(titleOverlay);

        // Add hover event listeners to wrapper
        wrapper.addEventListener("mouseenter", () => {
            // Main transform and shadow effects
            wrapper.style.transform = "translateY(-6px) scale(1.02)";
            wrapper.style.boxShadow = `0 12px 40px ${colors.shadow || "#00000088"},
                                       0 8px 20px ${colors.primaryShadowHeavy || "#00000055"}`;
            wrapper.style.borderColor = colors.primary || "";

            // Glow effect
            glowOverlay.style.opacity = "0.3";

            // Title overlay effect
            titleOverlay.style.opacity = "1";
            titleOverlay.style.transform = "translateY(0)";

            // Add subtle background gradient shift
            wrapper.style.background = `linear-gradient(135deg, ${colors.surface || "#222"} 0%, ${colors.surfaceSecondary || colors.surface || "#222"} 100%)`;
        });

        wrapper.addEventListener("mouseleave", () => {
            // Reset all effects
            wrapper.style.transform = "translateY(0) scale(1)";
            wrapper.style.boxShadow = `0 4px 20px ${colors.shadowLight || "#00000055"},
                                       0 2px 8px ${colors.primaryShadowLight || "#00000033"}`;
            wrapper.style.borderColor = colors.border || "";

            // Reset glow
            glowOverlay.style.opacity = "0";

            // Reset title overlay
            titleOverlay.style.opacity = "0";
            titleOverlay.style.transform = "translateY(-8px)";

            // Reset background
            wrapper.style.background = colors.surface || "#222";
        });

        // Add click ripple effect
        wrapper.addEventListener("click", (e) => {
            const rect = wrapper.getBoundingClientRect(),
                ripple = document.createElement("div"),
                size = Math.max(rect.width, rect.height),
                x = e.clientX - rect.left - size / 2,
                y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: radial-gradient(circle, ${themeConfig.colors.primary}40, transparent);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-effect 0.6s ease-out;
                pointer-events: none;
                z-index: 5;
            `;

            wrapper.append(ripple);

            // Remove ripple after animation
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        });

        console.log(`[ChartHoverEffects] Added hover effects to chart: ${chartTitle}`);
    }

    // Inject CSS keyframes for ripple effect if not already added
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

    console.log(`[ChartHoverEffects] Added hover effects to ${chartCanvases.length} chart(s)`);
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
