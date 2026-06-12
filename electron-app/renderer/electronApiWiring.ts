import { installRendererElectronApiRegistration } from "./electronApiRegistration.js";
import { createRendererElectronMenuActionHandlers } from "./electronMenuActionHandlers.js";

type RendererElectronApiWiringLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

type RendererElectronApiWiringOptions = {
    readonly callUnknownFunction: (
        target: unknown,
        args?: unknown[]
    ) => unknown;
    readonly electronApiCandidate: unknown;
    readonly ensureCoreModules: () => Promise<Record<string, unknown>>;
    readonly getFileInput: () => HTMLInputElement | null;
    readonly logRenderer: RendererElectronApiWiringLogger;
    readonly scheduleStateInitialization: () => void;
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
        electronApiCandidate: options.electronApiCandidate,
        onMenuAction: electronMenuActionHandlers.onMenuAction,
        onThemeChanged: electronMenuActionHandlers.onThemeChanged,
        scheduleStateInitialization: options.scheduleStateInitialization,
    });
}
