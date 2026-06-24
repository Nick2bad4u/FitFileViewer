import { installRendererElectronApiRegistration } from "./electronApiRegistration.js";
import {
    createRendererElectronMenuActionHandlers,
    type RendererElectronMenuCoreModules,
} from "./electronMenuActionHandlers.js";

type RendererElectronApiWiringLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

type RendererElectronApiWiringOptions = {
    readonly electronApiCandidate: unknown;
    readonly ensureCoreModules: () => Promise<RendererElectronMenuCoreModules>;
    readonly getFileInput: () => HTMLInputElement | null;
    readonly logRenderer: RendererElectronApiWiringLogger;
    readonly scheduleStateInitialization: () => void;
};

export function installRendererElectronApiWiring(
    options: RendererElectronApiWiringOptions
): void {
    const electronMenuActionHandlers = createRendererElectronMenuActionHandlers(
        {
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
