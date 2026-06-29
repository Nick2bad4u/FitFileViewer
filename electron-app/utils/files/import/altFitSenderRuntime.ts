import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserConsole,
    getBrowserDocument,
    getBrowserLocation,
} from "../../runtime/browserRuntime.js";

export type AltFitSenderLogger = Pick<Console, "error" | "warn">;

export interface AltFitSenderRuntimeEnvironment {
    readonly console: AltFitSenderLogger;
    readonly createAbortController: () => AbortController;
    readonly getElementById: (id: string) => HTMLElement | null;
    readonly location?: Pick<Location, "origin" | "protocol">;
}

type AltFitSenderRuntimeProvider<T> = (() => T | undefined) | undefined;

interface AltFitSenderRuntimeScope {
    readonly getAbortController: AltFitSenderRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getConsole: AltFitSenderRuntimeProvider<AltFitSenderLogger>;
    readonly getDocument: AltFitSenderRuntimeProvider<
        Pick<Document, "getElementById">
    >;
    readonly getLocation: AltFitSenderRuntimeProvider<
        Pick<Location, "origin" | "protocol">
    >;
}

const defaultAltFitSenderRuntimeScope: AltFitSenderRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getConsole: getBrowserConsole,
    getDocument: getBrowserDocument,
    getLocation: getBrowserLocation,
};

function getRequiredProvider<T>(
    provider: AltFitSenderRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(`Alt FIT sender requires ${providerName} provider`);
    }

    return provider;
}

function getScopeAbortController(
    scope: AltFitSenderRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getScopeConsole(scope: AltFitSenderRuntimeScope): AltFitSenderLogger {
    const logger = getRequiredProvider(scope.getConsole, "console")();
    if (logger === undefined) {
        throw new TypeError("Alt FIT sender requires a console runtime");
    }

    return logger;
}

function getScopeDocument(
    scope: AltFitSenderRuntimeScope
): Pick<Document, "getElementById"> | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function getScopeLocation(
    scope: AltFitSenderRuntimeScope
): Pick<Location, "origin" | "protocol"> | undefined {
    return getRequiredProvider(scope.getLocation, "location")();
}

export function getAltFitSenderRuntimeEnvironment(
    scope: AltFitSenderRuntimeScope = defaultAltFitSenderRuntimeScope
): AltFitSenderRuntimeEnvironment {
    const logger = getScopeConsole(scope);
    const location = getScopeLocation(scope);

    return {
        console: logger,
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "Alt FIT sender requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getElementById: (id) =>
            getScopeDocument(scope)?.getElementById(id) ?? null,
        ...(location === undefined ? {} : { location }),
    };
}
