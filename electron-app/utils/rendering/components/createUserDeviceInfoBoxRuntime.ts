export interface UserDeviceInfoBoxRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface UserDeviceInfoBoxRuntime {
    createAbortController(): AbortController;
}

const defaultUserDeviceInfoBoxRuntimeScope: UserDeviceInfoBoxRuntimeScope =
    globalThis;

export function getUserDeviceInfoBoxRuntime(
    scope: UserDeviceInfoBoxRuntimeScope = defaultUserDeviceInfoBoxRuntimeScope
): UserDeviceInfoBoxRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "createUserDeviceInfoBox requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
