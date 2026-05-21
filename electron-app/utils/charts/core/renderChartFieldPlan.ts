import { resolveChartAnimationTuning } from "./renderChartAnimationTuning.js";
import { resolveRenderableChartFields } from "./renderChartFieldSelection.js";
import { getLabelsForRecords } from "./renderChartLabelCache.js";

interface ChartFieldRenderPlanInput {
    readonly animationStyle: unknown;
    readonly isDebugLoggingEnabled: boolean;
    readonly recordMesgs: readonly unknown[];
    readonly renderableFields: unknown;
    readonly startTime: unknown;
}

interface ChartFieldRenderPlan {
    readonly effectiveAnimationStyle: unknown;
    readonly fieldsToRender: readonly string[];
    readonly labels: readonly number[];
}

/**
 * Resolves chart labels, candidate metric fields, and per-render animation tuning.
 *
 * @param input - Current chart render inputs.
 * @returns Field render plan consumed by primary chart rendering.
 */
export function resolveChartFieldRenderPlan(
    input: ChartFieldRenderPlanInput
): ChartFieldRenderPlan {
    const labels = getLabelsForRecords(input.recordMesgs, input.startTime);
    const fieldsToRender = resolveRenderableChartFields(
        input.renderableFields,
        input.recordMesgs
    );

    if (input.isDebugLoggingEnabled) {
        console.log(
            `[ChartJS] Processing ${fieldsToRender.length} candidate fields (visibility managed via settings state)`
        );
    }

    const { effectiveAnimationStyle, estimatedChartCount } =
        resolveChartAnimationTuning(
            input.animationStyle,
            fieldsToRender.length
        );
    if (
        input.isDebugLoggingEnabled &&
        effectiveAnimationStyle !== input.animationStyle
    ) {
        console.log(
            `[ChartJS] Auto-tuned animation from ${String(input.animationStyle)} to ${String(
                effectiveAnimationStyle
            )} (estimatedCharts=${estimatedChartCount})`
        );
    }

    return {
        effectiveAnimationStyle,
        fieldsToRender,
        labels,
    };
}
