import { detectCurrentTheme } from "./chartThemeUtils.js";

/**
 * Adds fancy hover effects to chart canvases to match the info box styling
 * @param {HTMLElement} chartContainer - Container with chart canvases
 * @param {Object} themeConfig - Theme configuration object
 */
export function addChartHoverEffects(chartContainer, themeConfig) {
    if (!chartContainer || !themeConfig) {
        console.warn("[ChartHoverEffects] Missing required parameters");
        return;
    }

    // Find all chart canvases in the container
    const chartCanvases = chartContainer.querySelectorAll(".chart-canvas");

    chartCanvases.forEach((canvas) => {
        // Skip if hover effects already added
        if (canvas.dataset.hoverEffectsAdded) {
            return;
        }

        // Mark as having hover effects
        canvas.dataset.hoverEffectsAdded = "true"; // Create a wrapper div for the chart to handle hover effects properly
        const wrapper = document.createElement("div");
        wrapper.className = "chart-wrapper";
        wrapper.style.cssText = `
            position: relative;
            margin-bottom: 24px;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            border: 2px solid ${themeConfig.colors.border};
            background: ${themeConfig.colors.surface};
            padding: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,${themeConfig.isDark ? "0.2" : "0.05"}), 
                        0 2px 8px rgba(${themeConfig.isDark ? "59, 130, 246" : "37, 99, 235"}, 0.05);
            box-sizing: border-box;
        `;

        // Insert wrapper before canvas and move canvas into wrapper
        canvas.parentNode.insertBefore(wrapper, canvas);
        wrapper.appendChild(canvas); // Update canvas styles to work with wrapper - ensure it stays inside
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

        // Add animated border glow overlay
        const glowOverlay = document.createElement("div");
        glowOverlay.className = "chart-glow-overlay";
        glowOverlay.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, ${themeConfig.colors.primary}, ${themeConfig.colors.accent}, ${themeConfig.colors.primary});
            border-radius: 14px;
            opacity: 0;
            z-index: -1;
            transition: opacity 0.4s ease;
            pointer-events: none;
        `;
        wrapper.appendChild(glowOverlay);

        // Add chart title overlay for better visual hierarchy
        const chartTitle = canvas.getAttribute("aria-label") || "Chart";
        const titleOverlay = document.createElement("div");
        titleOverlay.className = "chart-title-overlay";
        titleOverlay.style.cssText = `
            position: absolute;
            top: 8px;
            left: 16px;
            background: ${themeConfig.colors.primary};
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            opacity: 0;
            transform: translateY(-8px);
            transition: all 0.3s ease;
            z-index: 10;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        titleOverlay.textContent = chartTitle.replace("Chart for ", "").toUpperCase();
        wrapper.appendChild(titleOverlay);

        // Add hover event listeners to wrapper
        wrapper.addEventListener("mouseenter", () => {
            // Main transform and shadow effects
            wrapper.style.transform = "translateY(-6px) scale(1.02)";
            wrapper.style.boxShadow = `0 12px 40px rgba(0,0,0,${themeConfig.isDark ? "0.4" : "0.15"}), 
                                       0 8px 20px rgba(${themeConfig.isDark ? "59, 130, 246" : "37, 99, 235"}, 0.2)`;
            wrapper.style.borderColor = themeConfig.colors.primary;

            // Glow effect
            glowOverlay.style.opacity = "0.3";

            // Title overlay effect
            titleOverlay.style.opacity = "1";
            titleOverlay.style.transform = "translateY(0)";

            // Add subtle background gradient shift
            wrapper.style.background = `linear-gradient(135deg, ${themeConfig.colors.surface} 0%, ${themeConfig.colors.surfaceSecondary} 100%)`;
        });

        wrapper.addEventListener("mouseleave", () => {
            // Reset all effects
            wrapper.style.transform = "translateY(0) scale(1)";
            wrapper.style.boxShadow = `0 4px 20px rgba(0,0,0,${themeConfig.isDark ? "0.2" : "0.05"}), 
                                       0 2px 8px rgba(${themeConfig.isDark ? "59, 130, 246" : "37, 99, 235"}, 0.05)`;
            wrapper.style.borderColor = themeConfig.colors.border;

            // Reset glow
            glowOverlay.style.opacity = "0";

            // Reset title overlay
            titleOverlay.style.opacity = "0";
            titleOverlay.style.transform = "translateY(-8px)";

            // Reset background
            wrapper.style.background = themeConfig.colors.surface;
        });

        // Add click ripple effect
        wrapper.addEventListener("click", (e) => {
            const ripple = document.createElement("div");
            const rect = wrapper.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

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

            wrapper.appendChild(ripple);

            // Remove ripple after animation
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        });

        console.log(`[ChartHoverEffects] Added hover effects to chart: ${chartTitle}`);
    });

    // Inject CSS keyframes for ripple effect if not already added
    if (!document.getElementById("chart-hover-effects-styles")) {
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
        document.head.appendChild(style);
    }

    console.log(`[ChartHoverEffects] Added hover effects to ${chartCanvases.length} chart(s)`);
}

/**
 * Removes hover effects from chart containers (cleanup function)
 * @param {HTMLElement} chartContainer - Container with chart canvases
 */
export function removeChartHoverEffects(chartContainer) {
    if (!chartContainer) return;

    const chartWrappers = chartContainer.querySelectorAll(".chart-wrapper");
    chartWrappers.forEach((wrapper) => {
        const canvas = wrapper.querySelector(".chart-canvas");
        if (canvas && wrapper.parentNode) {
            // Move canvas back to original parent and remove wrapper
            wrapper.parentNode.insertBefore(canvas, wrapper);
            wrapper.parentNode.removeChild(wrapper);
            // Reset canvas styles to original createChartCanvas values
            canvas.style.border = "";
            canvas.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
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
            delete canvas.dataset.hoverEffectsAdded;
        }
    });

    console.log(`[ChartHoverEffects] Removed hover effects from ${chartWrappers.length} chart(s)`);
} /**
 * Development helper function to manually add hover effects to existing charts
 * This can be called from the browser console for testing
 */

export function addHoverEffectsToExistingCharts() {
    const chartContainer = document.getElementById("chartjs-chart-container");
    if (!chartContainer) {
        console.warn("[DevHelper] Chart container not found");
        return;
    }

    // Get theme configuration
    let themeConfig;
    if (window.getThemeConfig) {
        themeConfig = window.getThemeConfig();
    } else {
        const currentTheme = detectCurrentTheme();
        const isDark = currentTheme === "dark";
        themeConfig = {
            theme: currentTheme,
            isDark,
            isLight: !isDark,
            colors: {
                primary: isDark ? "#3b82f66550" : "#2563eb",
                background: isDark ? "#1a1a1a" : "#ffffff",
                surface: isDark ? "#181c24" : "#ffffff",
                surfaceSecondary: isDark ? "#4a5568" : "#e9ecef",
                text: isDark ? "#ffffff" : "#000000",
                textSecondary: isDark ? "#a0a0a0" : "#6b7280",
                border: isDark ? "#404040" : "#e5e7eb",
                accent: isDark ? "#63b3ed50" : "#007bff",
            },
        };
    }

    addChartHoverEffects(chartContainer, themeConfig);
    console.log("[DevHelper] Hover effects added to existing charts");
}
