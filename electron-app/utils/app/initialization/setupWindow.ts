/**
 * Window Setup and Initialization Modernized to use centralized state
 * management and remove hardcoded logic
 */

import { getRegisteredChartStateManager } from "../../charts/core/chartStateManagerRegistry.js";
import { chartTabIntegration } from "../../charts/core/chartTabIntegration.js";
import { setupTheme } from "../../theming/core/setupTheme.js";
import { applyTheme, listenForThemeChange } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { tabStateManager } from "../../ui/tabs/tabStateManager.js";
import type { RendererElectronApiScope } from "../../runtime/electronApiRuntime.js";

export type SetupWindowOptions = Readonly<{
    readonly electronApiScope?: RendererElectronApiScope | undefined;
}>;

/**
 * Clean up resources on window close.
 */
export function cleanup(): void {
    try {
        getRegisteredChartStateManager()?.destroy?.();
        tabStateManager.cleanup();
        chartTabIntegration.destroy();
        console.log("[setupWindow] Cleanup completed");
    } catch (error) {
        console.error("[setupWindow] Cleanup failed:", error);
    }
}

/**
 * Initialize the application window with modern state management.
 *
 * @throws Re-throws initialization errors after showing a notification.
 */
export async function setupWindow({
    electronApiScope,
}: SetupWindowOptions = {}): Promise<void> {
    try {
        console.log(
            "[setupWindow] Initializing with modern state management..."
        );

        // Initialize theme system first
        await setupTheme(applyTheme, listenForThemeChange, {
            electronApiScope,
        });

        // Initialize state managers in proper order
        // TabStateManager and chartStateManager are initialized automatically via constructors
        chartTabIntegration.initialize();

        // Set default tab to summary
        tabStateManager.switchToTab("summary");

        // Show initialization complete notification
        await showNotification(
            "Application initialized successfully",
            "success",
            2000
        );

        console.log("[setupWindow] Modern initialization complete");
    } catch (error) {
        console.error("[setupWindow] Initialization failed:", error);
        await showNotification(
            "Application initialization failed",
            "error",
            5000
        );
        throw error;
    }
}
