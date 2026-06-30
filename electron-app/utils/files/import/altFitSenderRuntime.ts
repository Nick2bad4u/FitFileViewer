import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLIFrameElementConstructor,
    getBrowserAbortController,
    getBrowserConsole,
    getBrowserDocument,
    getBrowserHTMLIFrameElement,
    getBrowserLocation,
} from "../../runtime/browserRuntime.js";

export type AltFitSenderLogger = Pick<Console, "error" | "warn">;

export interface AltFitSenderRuntimeEnvironment {
    readonly console: AltFitSenderLogger;
    readonly createAbortController: () => AbortController;
    readonly getElementById: (id: string) => HTMLElement | null;
    readonly isIFrameElement: (
        element: HTMLElement | null
    ) => element is HTMLIFrameElement;
    readonly location?: Pick<Location, "origin" | "protocol">;
    readonly postMessageToIFrame: (
        iframe: HTMLIFrameElement,
        message: unknown,
        targetOrigin: string
    ) => boolean;
}

type AltFitSenderRuntimeProvider<T> = (() => T | undefined) | undefined;

interface AltFitSenderRuntimeScope {
    readonly getAbortController: AltFitSenderRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getConsole: AltFitSenderRuntimeProvider<AltFitSenderLogger>;
    readonly getDocument: AltFitSenderRuntimeProvider<
        Pick<Document, "getElementById">
    >;
    readonly getHTMLIFrameElement: AltFitSenderRuntimeProvider<BrowserHTMLIFrameElementConstructor>;
    readonly getLocation: AltFitSenderRuntimeProvider<
        Pick<Location, "origin" | "protocol">
    >;
}

const defaultAltFitSenderRuntimeScope: AltFitSenderRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getConsole: getBrowserConsole,
    getDocument: getBrowserDocument,
    getHTMLIFrameElement: getBrowserHTMLIFrameElement,
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

function getScopeHTMLIFrameElement(
    scope: AltFitSenderRuntimeScope
): BrowserHTMLIFrameElementConstructor | undefined {
    return getRequiredProvider(
        scope.getHTMLIFrameElement,
        "HTMLIFrameElement"
    )();
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
        isIFrameElement(element): element is HTMLIFrameElement {
            const HTMLIFrameElementConstructor =
                getScopeHTMLIFrameElement(scope);
            if (typeof HTMLIFrameElementConstructor !== "function") {
                throw new TypeError(
                    "Alt FIT sender requires an HTMLIFrameElement runtime"
                );
            }

            return element instanceof HTMLIFrameElementConstructor;
        },
        ...(location === undefined ? {} : { location }),
        postMessageToIFrame(iframe, message, targetOrigin): boolean {
            const targetWindow = iframe.contentWindow;
            if (!targetWindow) {
                return false;
            }

            /* eslint-disable sdl/no-postmessage-without-origin-allowlist -- Electron file:// iframes can have an opaque origin. The child bridge still validates event.source and local file origins before accepting FIT payloads. */
            targetWindow.postMessage(message, targetOrigin);
            /* eslint-enable sdl/no-postmessage-without-origin-allowlist */
            return true;
        },
    };
}
