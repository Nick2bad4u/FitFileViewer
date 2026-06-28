export function normalizeRendererExporting(value: unknown): boolean {
    return value === true;
}

export function normalizeRendererExportUiBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    if (!("isExporting" in value)) {
        return value;
    }

    return {
        ...value,
        isExporting: normalizeRendererExporting(value["isExporting"]),
    };
}
