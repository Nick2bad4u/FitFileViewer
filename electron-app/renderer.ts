/**
 * @version 21.1.0
 *
 * @file Main renderer process entry point for FIT File Viewer Handles
 *   application initialization, module loading, and event setup
 *
 *   STATE MANAGEMENT MIGRATION: This file initializes the centralized state
 *   management system before wiring renderer lifecycle handlers. Key paths:
 *
 *   1. Imports masterStateManager, appActions, and uiStateManager
 *   2. Initializes state management system before other components
 *   3. Uses appActions.setInitialized() instead of direct state mutation
 *   4. Uses showNotification() for consistent UI notifications
 *   5. Creates module-owned state debugging utilities in development mode
 */

// ==========================================
// Type Definitions
// ==========================================
// ==========================================
// Utility Imports & Fallbacks
// ==========================================

import { isDevelopmentMode } from "./utils/app/initialization/rendererEnvironment.js";
import { AppActions } from "./utils/app/lifecycle/appActions.js";
import { applyTheme } from "./utils/theming/core/theme.js";
import { showAboutModal } from "./utils/ui/modals/aboutModal.js";
import { showNotification } from "./utils/ui/notifications/showNotification.js";
import { masterStateManager } from "./utils/state/core/masterStateManager.js";
import {
    getAppStartTime,
    subscribeToAppOpeningFile,
    subscribeToAppStartTime,
} from "./utils/state/domain/appDomainState.js";
import {
    createRendererPerformanceMonitor,
    type RendererPerformanceMonitor,
} from "./renderer/startupPerformanceMonitor.js";
import {
    ensureCoreModules,
    resolveExactRendererCoreTestOverride,
    resolveRendererCoreTestOverride,
} from "./renderer/coreModuleResolution.js";
import { installRendererElectronApiWiring } from "./renderer/electronApiWiring.js";
import { createRendererErrorEventHandlers } from "./renderer/errorHandling.js";
import { createRendererLifecycleCleanup } from "./renderer/lifecycleCleanup.js";
import { createRendererStateStartup } from "./renderer/stateManagerStartup.js";
import { createRendererApplicationStartup } from "./renderer/applicationStartup.js";
import { registerRendererApplicationLifecycle } from "./renderer/applicationLifecycleWiring.js";
import { createRendererRuntimeEnvironment } from "./renderer/runtimeEnvironment.js";
import { getBrowserRendererRuntimeEnvironmentScope } from "./renderer/rendererBrowserRuntime.js";
import {
    createRendererImportTimeBootstrap,
    runRendererImportTimeBootstrap,
} from "./renderer/importTimeBootstrap.js";
import { initializeRendererDiagnostics } from "./renderer/rendererDiagnosticsWiring.js";
import { createRendererFileInputWiring } from "./renderer/fileInputWiring.js";
import { registerRendererTestOnlyBootstrap } from "./renderer/testOnlyBootstrap.js";
import { createRendererDomAccess } from "./renderer/domElementAccess.js";
import { setLoading } from "./utils/ui/loading/syncRendererLoading.js";
import { setupCreditsMarquee } from "./utils/ui/layout/enhanceCreditsSection.js";

type LogRendererLevel = "error" | "group" | "groupEnd" | "log" | "warn";

const runtimeEnvironment = createRendererRuntimeEnvironment(
    getBrowserRendererRuntimeEnvironmentScope()
);
const rendererConsole = runtimeEnvironment.console;

/**
 * @param {"error" | "group" | "groupEnd" | "log" | "warn"} level
 * @param {...unknown} args
 *
 * @returns {void}
 */
function logRenderer(level: LogRendererLevel, ...args: unknown[]): void {
    const log = rendererConsole[level];
    if (typeof log === "function") {
        log.apply(rendererConsole, args);
    }
}

// ==========================================
// Environment Detection
// ==========================================

// ==========================================
// Application State Management
// ==========================================

const rendererStateStartup = createRendererStateStartup({
    logRenderer,
    masterStateManager,
    subscribeToAppOpeningFile,
});
const { initializeStateManager, isOpeningFileRef } = rendererStateStartup;

const domAccess = createRendererDomAccess({
    documentTarget: runtimeEnvironment.documentTarget,
    logRenderer,
});

const getRendererElectronApiScope = () => runtimeEnvironment.electronApiScope;

const importTimeBootstrap = createRendererImportTimeBootstrap({
    ensureCoreModules,
    getElectronApiScope: getRendererElectronApiScope,
    getAppStartTime,
    getOpenFileButton: domAccess.getOpenFileButton,
    initializeStateManager,
    isOpeningFileRef,
    setLoading,
    subscribeToAppStartTime,
});
const { scheduleImportTimeStateInitialization, scheduleImportTimeThemeSetup } =
    importTimeBootstrap;

const fileInputWiring = createRendererFileInputWiring({
    ensureCoreModules,
    getFileInput: domAccess.getFileInput,
    logRenderer,
    resolveExactRendererCoreTestOverride,
    resolveRendererCoreTestOverride,
});

const testOnlyBootstrapOptions = {
    getOpenFileButton: domAccess.getOpenFileButton,
    isOpeningFileRef,
    resolveExactRendererCoreTestOverride,
    resolveRendererCoreTestOverride,
    scheduleImportTimeThemeSetup,
    setLoading,
};

// ==========================================
// Error Handling
// ==========================================

const rendererErrorHandlers = createRendererErrorEventHandlers({
    logRenderer,
    showNotification,
});

// ==========================================
// Performance Monitoring
// ==========================================

const PerformanceMonitor: RendererPerformanceMonitor =
    createRendererPerformanceMonitor({
        isDevelopmentMode,
        logRenderer,
    });

const initializeApplication = createRendererApplicationStartup({
    addEventListener: runtimeEnvironment.addEventListener,
    appActions: AppActions,
    ensureCoreModules,
    errorHandlers: rendererErrorHandlers,
    getElectronApiScope: getRendererElectronApiScope,
    getAppStartTime,
    getOpenFileButton: domAccess.getOpenFileButton,
    initializeStateManager,
    isDevelopmentMode,
    isOpeningFileRef,
    logRenderer,
    performanceMonitor: PerformanceMonitor,
    setLoading,
    showNotification,
    setupCreditsMarquee,
    validateDOMElements: domAccess.validateDOMElements,
});

// ==========================================
// Performance Monitoring
// ==========================================

/**
 * Performance monitoring utilities
 *
 * @namespace PerformanceMonitor
 */
// ==========================================
// Application Lifecycle
// ==========================================

const cleanup = createRendererLifecycleCleanup({
    appActions: AppActions,
    errorHandlers: rendererErrorHandlers,
    isOpeningFileRef,
    logRenderer,
    masterStateManager,
    removeEventListener: runtimeEnvironment.removeEventListener,
});

registerRendererApplicationLifecycle({
    cleanup,
    documentTarget: runtimeEnvironment.documentTarget,
    initializeApplication,
    rendererEventTarget: runtimeEnvironment.rendererEventTarget,
    setTimeout: runtimeEnvironment.setTimeout,
});

initializeRendererDiagnostics({
    cleanup,
    ensureCoreModules,
    initializeApplication,
    isOpeningFileRef,
    logRenderer,
    performanceMonitor: PerformanceMonitor,
    validateDOMElements: domAccess.validateDOMElements,
});

// ==========================================
// Immediate wiring for tests and basic environments
// ==========================================

runRendererImportTimeBootstrap(importTimeBootstrap);
fileInputWiring.registerImportTimeFileInputChangeHandler(
    runtimeEnvironment.rendererEventTarget
);

installRendererElectronApiWiring({
    applyTheme,
    electronApiScope: runtimeEnvironment.electronApiScope,
    getFileInput: fileInputWiring.getFileInput,
    logRenderer,
    scheduleStateInitialization: scheduleImportTimeStateInitialization,
    showAboutModal,
});

registerRendererTestOnlyBootstrap(testOnlyBootstrapOptions, {
    documentTarget: runtimeEnvironment.documentTarget,
    rendererEventTarget: runtimeEnvironment.rendererEventTarget,
    unloadTarget: runtimeEnvironment.rendererEventTarget,
});

fileInputWiring.registerDelegatedFileInputChangeListener(
    runtimeEnvironment.documentTarget,
    runtimeEnvironment.rendererEventTarget
);
