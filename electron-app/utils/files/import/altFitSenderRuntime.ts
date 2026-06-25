import {
    getBrowserAbortController,
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

interface AltFitSenderRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getConsole?: (() => AltFitSenderLogger | undefined) | undefined;
    readonly getDocument?:
        | (() => Pick<Document, "getElementById"> | undefined)
        | undefined;
    readonly getLocation?:
        | (() => Pick<Location, "origin" | "protocol"> | undefined)
        | undefined;
}

const defaultAltFitSenderRuntimeScope: AltFitSenderRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getConsole: () => globalThis.console,
    getDocument: getBrowserDocument,
    getLocation: getBrowserLocation,
};

function getScopeAbortController(
    scope: AltFitSenderRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.();
}

function getScopeConsole(scope: AltFitSenderRuntimeScope): AltFitSenderLogger {
    const logger = scope.getConsole?.();
    if (logger === undefined) {
        throw new TypeError("Alt FIT sender requires a console runtime");
    }

    return logger;
}

function getScopeDocument(
    scope: AltFitSenderRuntimeScope
): Pick<Document, "getElementById"> | undefined {
    return scope.getDocument?.();
}

function getScopeLocation(
    scope: AltFitSenderRuntimeScope
): Pick<Location, "origin" | "protocol"> | undefined {
    return scope.getLocation?.();
}

export function getAltFitSenderRuntimeEnvironment(
    scope: AltFitSenderRuntimeScope = defaultAltFitSenderRuntimeScope
): AltFitSenderRuntimeEnvironment {
    const location = getScopeLocation(scope);

    return {
        console: getScopeConsole(scope),
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
