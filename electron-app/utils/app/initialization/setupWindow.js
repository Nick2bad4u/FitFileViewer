/**
 * Window Setup and Initialization
 * Modernized to use centralized state management and remove hardcoded logic
 */

import { chartStateManager } from "../../charts/core/chartStateManager.js";
import { chartTabIntegration } from "../../charts/core/chartTabIntegration.js";
import { setupTheme } from "../../theming/core/setupTheme.js";
import { applyTheme, listenForThemeChange } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { tabStateManager } from "../../ui/tabs/tabStateManager.js";

/**
 * Clean up resources on window close
 */
export function cleanup() {
    try {
        chartStateManager.cleanup();
        tabStateManager.cleanup();
        chartTabIntegration.cleanup();
        console.log("[setupWindow] Cleanup completed");
    } catch (error) {
        console.error("[setupWindow] Cleanup failed:", error);
    }
}

/**
 * Initialize the application window with modern state management
 * @returns {Promise<void>}
 */
export async function setupWindow() {
    try {
        console.log("[setupWindow] Initializing with modern state management...");

        // Initialize theme system first
        await setupTheme(applyTheme, listenForThemeChange);

        // Initialize state managers in proper order
        // TabStateManager and chartStateManager are initialized automatically via constructors
        chartTabIntegration.initialize();

        // Set default tab to summary
        tabStateManager.switchToTab("summary");

        // Show initialization complete notification
        showNotification("Application initialized successfully", "success", 2000);

        console.log("[setupWindow] Modern initialization complete");
    } catch (error) {
        console.error("[setupWindow] Initialization failed:", error);
        showNotification("Application initialization failed", "error", 5000);
        throw error;
    }
}
