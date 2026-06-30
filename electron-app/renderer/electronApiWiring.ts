import { installRendererElectronApiRegistration } from "./electronApiRegistration.js";
import {
    getElectronApiStartupHooks,
    type RendererApplyTheme,
} from "./electronApiStartupHooks.js";
import { createRendererElectronMenuActionHandlers } from "./electronMenuActionHandlers.js";
import type { ShowAboutModal } from "./startupCallbackTypes.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";

type RendererElectronApiWiringLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

type RendererElectronApiWiringOptions = {
    readonly applyTheme: RendererApplyTheme;
    readonly electronApiScope: RendererElectronApiScope;
    readonly getFileInput: () => HTMLInputElement | null;
    readonly logRenderer: RendererElectronApiWiringLogger;
    readonly scheduleStateInitialization: () => void;
    readonly showAboutModal: ShowAboutModal;
};

export function installRendererElectronApiWiring(
    options: RendererElectronApiWiringOptions
): void {
    const electronMenuActionHandlers = createRendererElectronMenuActionHandlers(
        {
            applyTheme: options.applyTheme,
            getFileInput: options.getFileInput,
            logRenderer: options.logRenderer,
            showAboutModal: options.showAboutModal,
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
