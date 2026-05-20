import { throttledAnimLog } from "../../debug/lastAnimLog.js";

type ChartAnimationOptions = {
    duration?: number;
    easing?: string;
    onComplete?: () => void;
    onProgress?: (context: AnimationProgressContext) => void;
    [key: string]: unknown;
};

type ChartAnimationsOptions = {
    animateRotate?: boolean;
    animateScale?: boolean;
    colors?: {
        duration: number;
        easing: string;
    };
    tension?: {
        duration: number;
        easing: string;
        from: number;
        to: number;
    };
    [key: string]: unknown;
};

type ChartOptions = {
    animation?: ChartAnimationOptions;
    animations?: ChartAnimationsOptions;
    [key: string]: unknown;
};

type ChartLike = {
    config?: {
        type?: unknown;
    };
    options?: ChartOptions;
    [key: string]: unknown;
};

type AnimationProgressContext = {
    currentStep?: unknown;
    numSteps?: unknown;
};

const ANIMATION_CONFIG = {
    DURATION: {
        COLORS: 1000,
        DEFAULT: 1200,
        TENSION: 1500,
    },
    EASING: {
        COLORS: "easeOutQuart",
        DEFAULT: "easeInOutQuart",
        TENSION: "easeOutQuart",
    },
    LINE_TENSION: {
        FROM: 0,
        TO: 0.4,
    },
} as const;

const CHART_TYPES = {
    BAR: "bar",
    DOUGHNUT: "doughnut",
    LINE: "line",
} as const;

const LOG_PREFIX = "[ChartAnimations]";

function isChartLike(chart: unknown): chart is ChartLike {
    return Boolean(chart) && typeof chart === "object";
}

function hasOptions(chart: ChartLike): chart is ChartLike & { options: ChartOptions } {
    return Boolean(chart.options) && typeof chart.options === "object";
}

/**
 * Updates animation configurations for Chart.js charts.
 *
 * @param chart - Chart.js chart instance to configure.
 * @param type - Chart type identifier for logging.
 * @returns Modified chart instance, or null when the chart input is invalid.
 */
export function updateChartAnimations(
    chart: unknown,
    type: unknown
): ChartLike | null {
    try {
        if (!isChartLike(chart)) {
            console.warn(`${LOG_PREFIX} Invalid chart instance provided`);
            return null;
        }

        if (!hasOptions(chart)) {
            console.warn(`${LOG_PREFIX} Chart instance missing options object`);
            return null;
        }

        if (typeof type !== "string" || type.length === 0) {
            console.warn(`${LOG_PREFIX} Invalid chart type provided:`, type);
            return chart;
        }

        chart.options.animation = {
            ...chart.options.animation,
            duration: ANIMATION_CONFIG.DURATION.DEFAULT,
            easing: ANIMATION_CONFIG.EASING.DEFAULT,
            onComplete: createCompletionCallback(type),
            onProgress: createProgressCallback(type),
        };

        const chartType = chart.config?.type;
        if (typeof chartType === "string" && chartType.length > 0) {
            configureTypeSpecificAnimations(chart, chartType);
        } else {
            console.warn(`${LOG_PREFIX} Chart config missing type property`);
        }

        console.log(
            `${LOG_PREFIX} Animation configuration updated for ${type} chart`
        );
        return chart;
    } catch (error) {
        console.error(`${LOG_PREFIX} Error updating chart animations:`, error);
        return isChartLike(chart) ? chart : null;
    }
}

function configureTypeSpecificAnimations(
    chart: ChartLike & { options: ChartOptions },
    chartType: string
): void {
    chart.options.animations ??= {};

    switch (chartType) {
        case CHART_TYPES.BAR: {
            chart.options.animations.colors = {
                duration: ANIMATION_CONFIG.DURATION.COLORS,
                easing: ANIMATION_CONFIG.EASING.COLORS,
            };
            break;
        }

        case CHART_TYPES.DOUGHNUT: {
            chart.options.animations.animateRotate = true;
            chart.options.animations.animateScale = true;
            break;
        }

        case CHART_TYPES.LINE: {
            chart.options.animations.tension = {
                duration: ANIMATION_CONFIG.DURATION.TENSION,
                easing: ANIMATION_CONFIG.EASING.TENSION,
                from: ANIMATION_CONFIG.LINE_TENSION.FROM,
                to: ANIMATION_CONFIG.LINE_TENSION.TO,
            };
            break;
        }

        default: {
            break;
        }
    }
}

function createCompletionCallback(type: string): () => void {
    return () => {
        console.log(`[ChartJS] ${type} chart animation complete`);
    };
}

function createProgressCallback(
    type: string
): (context: AnimationProgressContext) => void {
    return (context) => {
        if (
            typeof context.currentStep !== "number" ||
            typeof context.numSteps !== "number" ||
            context.numSteps <= 0
        ) {
            return;
        }

        const percentage = Math.round(
            (100 * context.currentStep) / context.numSteps
        );
        throttledAnimLog(`[ChartJS] ${type} chart animation: ${percentage}%`);
    };
}
