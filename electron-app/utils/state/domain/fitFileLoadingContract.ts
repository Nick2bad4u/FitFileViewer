import type {
    FitFileLoadingPhase,
    FitFileLoadingState,
} from "../core/stateManagerDefaults.js";

export const FIT_FILE_LOADING_PHASES = [
    "idle",
    "selecting",
    "reading",
    "validating",
    "parsing",
    "rendering",
    "loaded",
    "error",
] as const satisfies readonly FitFileLoadingPhase[];

type FitFileLoadingStateCandidate = Readonly<{
    readonly error?: unknown;
    readonly filePath?: unknown;
    readonly phase?: unknown;
    readonly progress?: unknown;
    readonly startedAt?: unknown;
    readonly updatedAt?: unknown;
}>;

export function isFitFileLoadingPhase(
    value: unknown
): value is FitFileLoadingPhase {
    return (
        typeof value === "string" &&
        (FIT_FILE_LOADING_PHASES as readonly string[]).includes(value)
    );
}

export function normalizeFitFileLoadingPhase(
    value: unknown
): FitFileLoadingPhase {
    return isFitFileLoadingPhase(value) ? value : "idle";
}

export function normalizeFitFileLoadingProgress(value: unknown): number {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function normalizeFitFileLoadingState(
    value: unknown
): FitFileLoadingState {
    const state = toFitFileLoadingStateCandidate(value);

    return {
        error: asNullableString(state["error"]),
        filePath: asNullableString(state["filePath"]),
        phase: normalizeFitFileLoadingPhase(state["phase"]),
        progress: normalizeFitFileLoadingProgress(state["progress"]),
        startedAt: asNullableTimestamp(state["startedAt"]),
        updatedAt: asNullableTimestamp(state["updatedAt"]),
    };
}

export function normalizeFitFileStateBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    let normalizedBranch: Record<string, unknown> | undefined;

    if ("loadingPhase" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["loadingPhase"] = normalizeFitFileLoadingPhase(
            value["loadingPhase"]
        );
    }

    if ("loadingProgress" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["loadingProgress"] = normalizeFitFileLoadingProgress(
            value["loadingProgress"]
        );
    }

    if ("loadingState" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["loadingState"] = normalizeFitFileLoadingState(
            value["loadingState"]
        );
    }

    return normalizedBranch ?? value;
}

function toFitFileLoadingStateCandidate(
    value: unknown
): FitFileLoadingStateCandidate {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}

function asNullableString(value: unknown): null | string {
    return typeof value === "string" ? value : null;
}

function asNullableTimestamp(value: unknown): null | number {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
