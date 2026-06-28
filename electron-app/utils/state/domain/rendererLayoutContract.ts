export function normalizeRendererSidebarCollapsed(value: unknown): boolean {
    return value === true;
}

export function normalizeRendererLayoutUiBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    if (!("sidebarCollapsed" in value)) {
        return value;
    }

    return {
        ...value,
        sidebarCollapsed: normalizeRendererSidebarCollapsed(
            value["sidebarCollapsed"]
        ),
    };
}
