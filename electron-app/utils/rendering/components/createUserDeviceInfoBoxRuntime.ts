export interface UserDeviceInfoBoxRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
}

export interface UserDeviceInfoBoxRuntime {
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
}

const defaultUserDeviceInfoBoxRuntimeScope: UserDeviceInfoBoxRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getDocument: () => globalThis.document,
};

export function getUserDeviceInfoBoxRuntime(
    scope: UserDeviceInfoBoxRuntimeScope = defaultUserDeviceInfoBoxRuntimeScope
): UserDeviceInfoBoxRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "createUserDeviceInfoBox requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            const runtimeDocument = scope.getDocument?.();
            if (!runtimeDocument) {
                throw new TypeError(
                    "createUserDeviceInfoBox requires a document runtime"
                );
            }

            return runtimeDocument.createElement(tagName);
        },
    };
}
