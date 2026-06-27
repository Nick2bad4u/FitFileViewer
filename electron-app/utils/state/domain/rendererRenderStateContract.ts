export function normalizeRendererRenderFlag(value: unknown): boolean {
    return value === true;
}

export function normalizeRendererChartRenderStateBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    let normalizedBranch: Record<string, unknown> | undefined;

    for (const key of [
        "isRendered",
        "isRendering",
        "tabActive",
    ]) {
        if (key in value) {
            normalizedBranch ??= { ...value };
            normalizedBranch[key] = normalizeRendererRenderFlag(value[key]);
        }
    }

    return normalizedBranch ?? value;
}

export function normalizeRendererMapRenderStateBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    let normalizedBranch: Record<string, unknown> | undefined;

    for (const key of ["isRendered", "measurementMode"]) {
        if (key in value) {
            normalizedBranch ??= { ...value };
            normalizedBranch[key] = normalizeRendererRenderFlag(value[key]);
        }
    }

    return normalizedBranch ?? value;
}

export function normalizeRendererTableRenderStateBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    if (!("isRendered" in value)) {
        return value;
    }

    return {
        ...value,
        isRendered: normalizeRendererRenderFlag(value["isRendered"]),
    };
}
