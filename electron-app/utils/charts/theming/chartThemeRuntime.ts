export type ChartTheme = "dark" | "light";

export interface ChartThemeRuntimeScope {
    readonly document?: Pick<Document, "body"> | undefined;
    readonly getDocument?: (() => Pick<Document, "body"> | undefined) | undefined;
    readonly getLocalStorage?:
        | (() => Pick<Storage, "getItem"> | undefined)
        | undefined;
    readonly getMatchMedia?:
        | (() => ((query: string) => Pick<MediaQueryList, "matches">) | undefined)
        | undefined;
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

const defaultChartThemeRuntimeScope: ChartThemeRuntimeScope = {
    getDocument: () => globalThis.document,
    getLocalStorage: () => globalThis.localStorage,
    getMatchMedia: () => globalThis.matchMedia,
};

function getScopeDocument(
    scope: ChartThemeRuntimeScope
): Pick<Document, "body"> | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function getScopeLocalStorage(
    scope: ChartThemeRuntimeScope
): Pick<Storage, "getItem"> | undefined {
    return scope.getLocalStorage?.() ?? scope.localStorage;
}

function getScopeMatchMedia(
    scope: ChartThemeRuntimeScope
): ((query: string) => Pick<MediaQueryList, "matches">) | undefined {
    return scope.getMatchMedia?.() ?? scope.matchMedia;
}

export function getChartThemeRuntime(
    scope: ChartThemeRuntimeScope = defaultChartThemeRuntimeScope
): ChartThemeRuntime {
    return {
        getSavedTheme(): null | string {
            return getScopeLocalStorage(scope)?.getItem("ffv-theme") ?? null;
        },
        getSystemPreferredTheme(): ChartTheme {
            return getScopeMatchMedia(scope)?.(DARK_SCHEME_QUERY).matches
                ? "dark"
                : "light";
        },
        hasBodyThemeClass(themeClass: string): boolean {
            return (
                getScopeDocument(scope)?.body.classList.contains(themeClass) ??
                false
            );
        },
    };
}
