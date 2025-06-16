import { throttledAnimLog } from "./lastAnimLog.js";

// Helper function to update animation configurations for all charts
export function updateChartAnimations(chart, type) {
    if (!chart || !chart.options) return;

    // Update animation configuration
    if (!chart.options.animation) {
        chart.options.animation = {};
    }

    chart.options.animation = {
        ...chart.options.animation,
        duration: 1200,
        easing: "easeInOutQuart",
        onProgress: function (context) {
            if (context && context.currentStep !== undefined && context.numSteps !== undefined) {
                throttledAnimLog(
                    `[ChartJS] ${type} chart animation: ${Math.round((100 * context.currentStep) / context.numSteps)}%`
                );
            }
        },
        onComplete: function () {
            console.log(`[ChartJS] ${type} chart animation complete`);
        },
    };

    // Add animations configuration based on chart type
    if (!chart.options.animations) {
        chart.options.animations = {};
    }

    if (chart.config.type === "line") {
        chart.options.animations.tension = {
            duration: 1500,
            easing: "easeOutQuart",
            from: 0,
            to: 0.4,
        };
    } else if (chart.config.type === "bar") {
        chart.options.animations.colors = {
            duration: 1000,
            easing: "easeOutQuart",
        };
    } else if (chart.config.type === "doughnut") {
        chart.options.animations.animateRotate = true;
        chart.options.animations.animateScale = true;
    }

    return chart;
}
