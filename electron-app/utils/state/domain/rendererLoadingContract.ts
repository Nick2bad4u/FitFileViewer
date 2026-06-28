export function normalizeRendererLoading(value: unknown): boolean {
    return value === true;
}

export type RendererLoadingIndicatorState = {
    active: boolean;
    progress: number;
};

type RendererLoadingIndicatorCandidate = Readonly<{
    active?: unknown;
    progress?: unknown;
}>;

export const DEFAULT_RENDERER_LOADING_INDICATOR: RendererLoadingIndicatorState =
    {
        active: false,
        progress: 0,
    };

export function normalizeRendererLoadingIndicator(
    value: unknown
): RendererLoadingIndicatorState {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return { ...DEFAULT_RENDERER_LOADING_INDICATOR };
    }

    const candidate = value as RendererLoadingIndicatorCandidate;
    return {
        active: candidate.active === true,
        progress:
            typeof candidate.progress === "number" &&
            Number.isFinite(candidate.progress)
                ? candidate.progress
                : 0,
    };
}

export function normalizeRendererLoadingUiBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    if (!("loadingIndicator" in value)) {
        return value;
    }

    return {
        ...value,
        loadingIndicator: normalizeRendererLoadingIndicator(
            value["loadingIndicator"]
        ),
    };
}
