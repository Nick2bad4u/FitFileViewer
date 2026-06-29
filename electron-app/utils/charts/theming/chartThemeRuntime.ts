import {
    getBrowserDocument,
    getBrowserLocalStorage,
    getBrowserMatchMedia,
} from "../../runtime/browserRuntime.js";

export type ChartTheme = "dark" | "light";

export interface ChartThemeRuntimeScope {
    readonly getDocument: ChartThemeRuntimeProvider<Pick<Document, "body">>;
    readonly getLocalStorage: ChartThemeRuntimeProvider<
        Pick<Storage, "getItem">
    >;
    readonly getMatchMedia: ChartThemeRuntimeProvider<
        (query: string) => Pick<MediaQueryList, "matches">
    >;
}

export interface ChartThemeRuntime {
    hasBodyThemeClass(themeClass: string): boolean;
    getSavedTheme(): null | string;
    getSystemPreferredTheme(): ChartTheme;
}

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

type ChartThemeRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultChartThemeRuntimeScope: ChartThemeRuntimeScope = {
    getDocument: getBrowserDocument,
    getLocalStorage: getBrowserLocalStorage,
    getMatchMedia: getBrowserMatchMedia,
};

function getScopeDocument(
    getDocument: () => Pick<Document, "body"> | undefined
): Pick<Document, "body"> | undefined {
    return getDocument();
}

function getScopeLocalStorage(
    getLocalStorage: () => Pick<Storage, "getItem"> | undefined
): Pick<Storage, "getItem"> | undefined {
    return getLocalStorage();
}

function getScopeMatchMedia(
    getMatchMedia: () =>
        | ((query: string) => Pick<MediaQueryList, "matches">)
        | undefined
): ((query: string) => Pick<MediaQueryList, "matches">) | undefined {
    return getMatchMedia();
}

export function getChartThemeRuntime(
    scope: ChartThemeRuntimeScope = defaultChartThemeRuntimeScope
): ChartThemeRuntime {
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getLocalStorage = getRequiredProvider(
        scope.getLocalStorage,
        "localStorage"
    );
    const getMatchMedia = getRequiredProvider(
        scope.getMatchMedia,
        "matchMedia"
    );

    return {
        getSavedTheme(): null | string {
            return (
                getScopeLocalStorage(getLocalStorage)?.getItem("ffv-theme") ??
                null
            );
        },
        getSystemPreferredTheme(): ChartTheme {
            return getScopeMatchMedia(getMatchMedia)?.(DARK_SCHEME_QUERY)
                .matches
                ? "dark"
                : "light";
        },
        hasBodyThemeClass(themeClass: string): boolean {
            return (
                getScopeDocument(getDocument)?.body.classList.contains(
                    themeClass
                ) ?? false
            );
        },
    };
}

function getRequiredProvider<T>(
    provider: ChartThemeRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `chartThemeRuntime requires a ${providerName} provider`
        );
    }

    return provider;
}
