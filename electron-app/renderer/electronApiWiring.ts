import { installRendererElectronApiRegistration } from "./electronApiRegistration.js";
import { getElectronApiStartupHooks } from "./electronApiStartupHooks.js";
import {
    createRendererElectronMenuActionHandlers,
    type RendererElectronMenuCoreModules,
} from "./electronMenuActionHandlers.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";

type RendererElectronApiWiringLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

type RendererElectronApiWiringOptions = {
    readonly electronApiScope: RendererElectronApiScope;
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
        electronApiHooks: getElectronApiStartupHooks({
            getElectronApiScope: () => options.electronApiScope,
        }),
        onMenuAction: electronMenuActionHandlers.onMenuAction,
        onThemeChanged: electronMenuActionHandlers.onThemeChanged,
        scheduleStateInitialization: options.scheduleStateInitialization,
    });
}
