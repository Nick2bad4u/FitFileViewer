export interface AccentColorPickerRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface AccentColorPickerRuntime {
    createAbortController: () => AbortController;
}

function getAbortControllerConstructor(
    scope: AccentColorPickerRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "accentColorPicker requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

export function getAccentColorPickerRuntime(
    scope: AccentColorPickerRuntimeScope = globalThis
): AccentColorPickerRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}
