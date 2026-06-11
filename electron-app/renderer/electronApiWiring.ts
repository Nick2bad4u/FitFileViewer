import { installRendererElectronApiRegistration } from "./electronApiRegistration.js";
import { createRendererElectronMenuActionHandlers } from "./electronMenuActionHandlers.js";

type RendererElectronApiWiringLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

type RendererElectronApiWiringOptions = {
    readonly addEventListener: typeof globalThis.addEventListener;
    readonly callUnknownFunction: (
        target: unknown,
        args?: unknown[]
    ) => unknown;
    readonly clearInterval: typeof globalThis.clearInterval;
    readonly defineProperty: typeof Object.defineProperty;
    readonly electronApiCandidate: unknown;
    readonly ensureCoreModules: () => Promise<Record<string, unknown>>;
    readonly getFileInput: () => HTMLInputElement | null;
    readonly logRenderer: RendererElectronApiWiringLogger;
    readonly removeEventListener: typeof globalThis.removeEventListener;
    readonly scheduleStateInitialization: () => void;
    readonly scope: typeof globalThis;
    readonly setInterval: typeof globalThis.setInterval;
};

export function installRendererElectronApiWiring(
    options: RendererElectronApiWiringOptions
): void {
    const electronMenuActionHandlers = createRendererElectronMenuActionHandlers(
        {
            callUnknownFunction: options.callUnknownFunction,
            ensureCoreModules: options.ensureCoreModules,
            getFileInput: options.getFileInput,
            logRenderer: options.logRenderer,
        }
    );

    installRendererElectronApiRegistration({
        addEventListener: options.addEventListener,
        clearInterval: options.clearInterval,
        defineProperty: options.defineProperty,
        electronApiCandidate: options.electronApiCandidate,
        onMenuAction: electronMenuActionHandlers.onMenuAction,
        onThemeChanged: electronMenuActionHandlers.onThemeChanged,
        removeEventListener: options.removeEventListener,
        scheduleStateInitialization: options.scheduleStateInitialization,
        scope: options.scope,
        setInterval: options.setInterval,
    });
}
