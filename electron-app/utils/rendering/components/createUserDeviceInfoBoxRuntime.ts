export interface UserDeviceInfoBoxRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface UserDeviceInfoBoxRuntime {
    readonly createAbortController: () => AbortController;
}

const defaultUserDeviceInfoBoxRuntimeScope: UserDeviceInfoBoxRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
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
    };
}
