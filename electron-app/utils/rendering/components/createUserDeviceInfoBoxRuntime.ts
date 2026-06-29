import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

export interface UserDeviceInfoBoxRuntimeScope {
    readonly getAbortController:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getDocument: (() => Document | undefined) | undefined;
}

export interface UserDeviceInfoBoxRuntime {
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
}

const defaultUserDeviceInfoBoxRuntimeScope: UserDeviceInfoBoxRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDocument: getBrowserDocument,
};

export function getUserDeviceInfoBoxRuntime(
    scope: UserDeviceInfoBoxRuntimeScope = defaultUserDeviceInfoBoxRuntimeScope
): UserDeviceInfoBoxRuntime {
    return {
        createAbortController(): AbortController {
            const getAbortController = scope.getAbortController;
            if (typeof getAbortController !== "function") {
                throw new TypeError(
                    "createUserDeviceInfoBox requires an AbortController provider"
                );
            }

            const AbortControllerConstructor = getAbortController();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "createUserDeviceInfoBox requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            const getDocument = scope.getDocument;
            if (typeof getDocument !== "function") {
                throw new TypeError(
                    "createUserDeviceInfoBox requires a document provider"
                );
            }

            const runtimeDocument = getDocument();
            if (!runtimeDocument) {
                throw new TypeError(
                    "createUserDeviceInfoBox requires a document runtime"
                );
            }

            return runtimeDocument.createElement(tagName);
        },
    };
}
