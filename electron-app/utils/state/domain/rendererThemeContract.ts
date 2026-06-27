export const RENDERER_THEME_NAMES = [
    "dark",
    "light",
    "system",
] as const;

export type RendererThemeName = (typeof RENDERER_THEME_NAMES)[number];

const RENDERER_THEME_NAME_SET = new Set<string>(RENDERER_THEME_NAMES);

export function isRendererThemeName(
    value: unknown
): value is RendererThemeName {
    return typeof value === "string" && RENDERER_THEME_NAME_SET.has(value);
}

export function normalizeRendererTheme(value: unknown): RendererThemeName {
    if (value === "auto") {
        return "system";
    }

    return isRendererThemeName(value) ? value : "system";
}

export function normalizeRendererThemeUiBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    let normalizedBranch: Record<string, unknown> | undefined;

    for (const key of ["previousTheme", "theme"]) {
        if (key in value) {
            normalizedBranch ??= { ...value };
            normalizedBranch[key] = normalizeRendererTheme(value[key]);
        }
    }

    return normalizedBranch ?? value;
}
