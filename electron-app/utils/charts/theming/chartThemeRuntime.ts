export type ChartTheme = "dark" | "light";

export interface ChartThemeRuntimeScope {
    readonly document?: Pick<Document, "body"> | undefined;
    readonly localStorage?: Pick<Storage, "getItem"> | undefined;
    readonly matchMedia?:
        | ((query: string) => Pick<MediaQueryList, "matches">)
        | undefined;
}

export interface ChartThemeRuntime {
    hasBodyThemeClass(themeClass: string): boolean;
    getSavedTheme(): null | string;
    getSystemPreferredTheme(): ChartTheme;
}

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const defaultChartThemeRuntimeScope: ChartThemeRuntimeScope = globalThis;

export function getChartThemeRuntime(
    scope: ChartThemeRuntimeScope = defaultChartThemeRuntimeScope
): ChartThemeRuntime {
    return {
        getSavedTheme(): null | string {
            return scope.localStorage?.getItem("ffv-theme") ?? null;
        },
        getSystemPreferredTheme(): ChartTheme {
            return scope.matchMedia?.(DARK_SCHEME_QUERY).matches
                ? "dark"
                : "light";
        },
        hasBodyThemeClass(themeClass: string): boolean {
            return scope.document?.body.classList.contains(themeClass) ?? false;
        },
    };
}
