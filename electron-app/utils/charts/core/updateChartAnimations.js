/**
 * @fileoverview Chart animation configuration utility for FitFileViewer
 *
 * Updates chart animation configurations based on chart type with smooth easing
 * and progress tracking. Supports line, bar, and doughnut chart types with
 * type-specific animation settings.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { throttledAnimLog } from "../../debug/lastAnimLog.js";

// Animation configuration constants
const ANIMATION_CONFIG = {
    DURATION: {
        DEFAULT: 1200,
        TENSION: 1500,
        COLORS: 1000,
    },
    EASING: {
        DEFAULT: "easeInOutQuart",
        TENSION: "easeOutQuart",
        COLORS: "easeOutQuart",
    },
    LINE_TENSION: {
        FROM: 0,
        TO: 0.4,
    },
};

const CHART_TYPES = {
    LINE: "line",
    BAR: "bar",
    DOUGHNUT: "doughnut",
};

const LOG_PREFIX = "[ChartAnimations]";

/**
 * Creates progress callback for chart animations
 * @param {string} type - Chart type for logging
 * @returns {Function} Progress callback function
 */
function createProgressCallback(type) {
    return function (context) {
        if (context && context.currentStep !== undefined && context.numSteps !== undefined && context.numSteps > 0) {
            const percentage = Math.round((100 * context.currentStep) / context.numSteps);
            throttledAnimLog(`[ChartJS] ${type} chart animation: ${percentage}%`);
        }
    };
}

/**
 * Creates completion callback for chart animations
 * @param {string} type - Chart type for logging
 * @returns {Function} Completion callback function
 */
function createCompletionCallback(type) {
    return function () {
        console.log(`[ChartJS] ${type} chart animation complete`);
    };
}

/**
 * Configures type-specific animations for a chart
 * @param {Object} chart - Chart.js chart instance
 * @param {string} chartType - Type of chart (line, bar, doughnut)
 */
function configureTypeSpecificAnimations(chart, chartType) {
    if (!chart.options.animations) {
        chart.options.animations = {};
    }

    switch (chartType) {
        case CHART_TYPES.LINE:
            chart.options.animations.tension = {
                duration: ANIMATION_CONFIG.DURATION.TENSION,
                easing: ANIMATION_CONFIG.EASING.TENSION,
                from: ANIMATION_CONFIG.LINE_TENSION.FROM,
                to: ANIMATION_CONFIG.LINE_TENSION.TO,
            };
            break;

        case CHART_TYPES.BAR:
            chart.options.animations.colors = {
                duration: ANIMATION_CONFIG.DURATION.COLORS,
                easing: ANIMATION_CONFIG.EASING.COLORS,
            };
            break;

        case CHART_TYPES.DOUGHNUT:
            chart.options.animations.animateRotate = true;
            chart.options.animations.animateScale = true;
            break;

        default:
            // No specific animations for other chart types
            break;
    }
}

/**
 * Updates animation configurations for Chart.js charts
 *
 * Configures smooth animations with progress tracking and type-specific
 * animation settings. Returns the modified chart instance.
 *
 * @param {Object} chart - Chart.js chart instance to configure
 * @param {string} type - Chart type identifier for logging
 * @returns {Object|null} Modified chart instance or null if invalid input
 */
export function updateChartAnimations(chart, type) {
    try {
        // Validate inputs
        if (!chart || typeof chart !== "object") {
            console.warn(`${LOG_PREFIX} Invalid chart instance provided`);
            return null;
        }

        if (!chart.options || typeof chart.options !== "object") {
            console.warn(`${LOG_PREFIX} Chart instance missing options object`);
            return null;
        }

        if (!type || typeof type !== "string") {
            console.warn(`${LOG_PREFIX} Invalid chart type provided:`, type);
            return chart;
        }

        // Initialize animation configuration if missing
        if (!chart.options.animation) {
            chart.options.animation = {};
        }

        // Configure base animation settings
        chart.options.animation = {
            ...chart.options.animation,
            duration: ANIMATION_CONFIG.DURATION.DEFAULT,
            easing: ANIMATION_CONFIG.EASING.DEFAULT,
            onProgress: createProgressCallback(type),
            onComplete: createCompletionCallback(type),
        };

        // Configure type-specific animations
        const chartType = chart.config?.type;
        if (chartType) {
            configureTypeSpecificAnimations(chart, chartType);
        } else {
            console.warn(`${LOG_PREFIX} Chart config missing type property`);
        }

        console.log(`${LOG_PREFIX} Animation configuration updated for ${type} chart`);
        return chart;
    } catch (error) {
        console.error(`${LOG_PREFIX} Error updating chart animations:`, error);
        return chart; // Return original chart to avoid breaking functionality
    }
}
