import { getElectronApiHooksFromValue } from "./electronApiStartupHooks.js";
import { registerRendererElectronApiCandidate } from "../utils/runtime/electronApiRuntime.js";

type DefineProperty = typeof Object.defineProperty;
type IntervalHandle = ReturnType<typeof setInterval>;

interface RendererElectronApiRegistrationOptions {
    clearInterval: (handle: IntervalHandle) => void;
    defineProperty: DefineProperty;
    onMenuAction: (action: unknown) => void;
    onThemeChanged: (theme: string) => void;
    removeEventListener: typeof globalThis.removeEventListener;
    scheduleStateInitialization: () => void;
    scope: typeof globalThis;
    setInterval: typeof globalThis.setInterval;
    addEventListener: typeof globalThis.addEventListener;
}

export function installRendererElectronApiRegistration(
    options: RendererElectronApiRegistrationOptions
): void {
    try {
        const currentElectronAPI = Reflect.get(options.scope, "electronAPI");
        if (currentElectronAPI !== undefined) {
            registerRendererElectronAPI(currentElectronAPI, options);
        }

        installRendererElectronAPIProxy(options);
        if (isVitestManualMockEnvironment(options.scope)) {
            installElectronAPIDefinePropertyInterceptor(options);
            startRendererElectronAPITestPolling(options);
        }
    } catch {
        /* Ignore errors */
    }
}

export function installRendererElectronAPIProxy(
    options: RendererElectronApiRegistrationOptions
): void {
    try {
        let electronApiValue = Reflect.get(options.scope, "electronAPI");
        options.defineProperty(options.scope, "electronAPI", {
            configurable: true,
            get() {
                return electronApiValue;
            },
            set(value: unknown) {
                electronApiValue = value;
                registerRendererElectronAPI(value, options);
            },
        });

        registerRendererElectronAPI(electronApiValue, options);
    } catch {
        /* Ignore errors */
    }
}

export function installElectronAPIDefinePropertyInterceptor(
    options: RendererElectronApiRegistrationOptions
): void {
    try {
        const nativeDefine = options.defineProperty;
        Object.defineProperty = function defineProperty<T>(
            target: T,
            prop: PropertyKey,
            descriptor: PropertyDescriptor & ThisType<unknown>
        ) {
            const result = nativeDefine.call(
                Object,
                target,
                prop,
                descriptor
            ) as T;
            try {
                if (
                    target === options.scope &&
                    String(prop) === "electronAPI" &&
                    "value" in descriptor
                ) {
                    registerRendererElectronAPIFromPropertyDescriptor(
                        descriptor,
                        options
                    );
                }
            } catch {
                /* Ignore errors */
            }
            return result;
        };
    } catch {
        /* Ignore errors */
    }
}

export function isVitestManualMockEnvironment(
    scope: typeof globalThis
): boolean {
    return Boolean(Reflect.get(scope, "__vitest_manual_mocks__"));
}

export function registerRendererElectronAPI(
    api: unknown,
    options: RendererElectronApiRegistrationOptions
): void {
    try {
        registerRendererElectronApiCandidate(api);

        const hooks = getElectronApiHooksFromValue(api);
        if (hooks === null) {
            return;
        }

        if (hooks.onMenuAction !== undefined) {
            hooks.onMenuAction(options.onMenuAction);
        }
        if (hooks.onThemeChanged !== undefined) {
            hooks.onThemeChanged(options.onThemeChanged);
        }
        if (hooks.isDevelopment !== undefined) {
            void queryElectronDevelopmentMode(hooks.isDevelopment);
        }
        options.scheduleStateInitialization();
    } catch {
        /* Ignore errors */
    }
}

export function registerRendererElectronAPIFromPropertyDescriptor(
    descriptor: PropertyDescriptor,
    options: RendererElectronApiRegistrationOptions
): void {
    if (!("value" in descriptor)) {
        return;
    }

    registerRendererElectronAPI(descriptor.value, options);
    options.scheduleStateInitialization();
}

export function registerRendererElectronPollingCleanup(
    clearPolling: () => unknown,
    options: RendererElectronApiRegistrationOptions
): void {
    const abortController = new AbortController();
    const { signal } = abortController;
    const onElectronAPIPollingBeforeUnload = (): void => {
        clearPolling();
        options.removeEventListener(
            "beforeunload",
            onElectronAPIPollingBeforeUnload
        );
        abortController.abort();
    };

    options.addEventListener("beforeunload", onElectronAPIPollingBeforeUnload, {
        signal,
    });
}

export function startRendererElectronAPITestPolling(
    options: RendererElectronApiRegistrationOptions
): void {
    let lastElectronAPI: unknown;
    const intervalId = options.setInterval(() => {
        try {
            const currentElectronAPI = Reflect.get(
                options.scope,
                "electronAPI"
            );
            if (
                currentElectronAPI !== undefined &&
                currentElectronAPI !== lastElectronAPI
            ) {
                lastElectronAPI = currentElectronAPI;
                registerRendererElectronAPI(currentElectronAPI, options);
            }
            options.scheduleStateInitialization();
        } catch {
            /* Ignore errors */
        }
    }, 1);

    registerRendererElectronPollingCleanup(() => {
        options.clearInterval(intervalId);
    }, options);
}

async function queryElectronDevelopmentMode(
    isDevelopment: () => Promise<unknown>
): Promise<void> {
    try {
        await isDevelopment();
    } catch {
        /* Ignore errors */
    }
}
