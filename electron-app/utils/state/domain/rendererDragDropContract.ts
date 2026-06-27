export type RendererDropOverlayState = {
    visible: boolean;
};

export function normalizeDragCounter(value: unknown): number {
    const counter = Number(value);
    return Number.isFinite(counter) && counter > 0 ? counter : 0;
}

export const normalizeDropOverlayVisible: (value: unknown) => boolean = Boolean;

export function normalizeRendererDragDropUiBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    let normalizedBranch: Record<string, unknown> | undefined;

    if ("dragCounter" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["dragCounter"] = normalizeDragCounter(
            value["dragCounter"]
        );
    }

    if ("dropOverlay" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["dropOverlay"] = normalizeDropOverlayState(
            value["dropOverlay"]
        );
    }

    return normalizedBranch ?? value;
}

function normalizeDropOverlayState(value: unknown): RendererDropOverlayState {
    if (isRecord(value)) {
        return {
            ...value,
            visible: normalizeDropOverlayVisible(value["visible"]),
        };
    }

    return { visible: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
