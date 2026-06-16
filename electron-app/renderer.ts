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
import {
    createRendererPerformanceMonitor,
    type RendererPerformanceMonitor,
} from "./renderer/startupPerformanceMonitor.js";
import {
    callUnknownFunction,
    ensureCoreModules,
    resolveExactRendererCoreTestOverride,
    resolveRendererCoreTestOverride,
    toModuleRecord,
} from "./renderer/coreModuleResolution.js";
import { installRendererElectronApiWiring } from "./renderer/electronApiWiring.js";
import { createRendererErrorEventHandlers } from "./renderer/errorHandling.js";
import { createRendererLifecycleCleanup } from "./renderer/lifecycleCleanup.js";
import { createRendererStateStartup } from "./renderer/stateManagerStartup.js";
import { createRendererApplicationStartup } from "./renderer/applicationStartup.js";
import { registerRendererApplicationLifecycle } from "./renderer/applicationLifecycleWiring.js";
import { createRendererRuntimeEnvironment } from "./renderer/runtimeEnvironment.js";
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

const runtimeEnvironment = createRendererRuntimeEnvironment();
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
    ensureCoreModules,
    logRenderer,
    toModuleRecord,
});
const { initializeStateManager, isOpeningFileRef } = rendererStateStartup;

const domAccess = createRendererDomAccess({
    documentTarget: runtimeEnvironment.documentTarget,
    logRenderer,
});

const importTimeBootstrap = createRendererImportTimeBootstrap({
    callUnknownFunction,
    ensureCoreModules,
    getOpenFileButton: domAccess.getOpenFileButton,
    initializeStateManager,
    isOpeningFileRef,
    resolveExactRendererCoreTestOverride,
    resolveRendererCoreTestOverride,
    setLoading,
    toModuleRecord,
});
const { scheduleImportTimeStateInitialization, scheduleImportTimeThemeSetup } =
    importTimeBootstrap;

const fileInputWiring = createRendererFileInputWiring({
    callUnknownFunction,
    ensureCoreModules,
    getFileInput: domAccess.getFileInput,
    logRenderer,
    resolveExactRendererCoreTestOverride,
    resolveRendererCoreTestOverride,
    toModuleRecord,
});

const testOnlyBootstrapOptions = {
    callUnknownFunction,
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
    getCoreModules: ensureCoreModules,
    logRenderer,
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
    callUnknownFunction,
    ensureCoreModules,
    errorHandlers: rendererErrorHandlers,
    getFileInput: fileInputWiring.getFileInput,
    getOpenFileButton: domAccess.getOpenFileButton,
    initializeStateManager,
    isDevelopmentMode,
    isOpeningFileRef,
    logRenderer,
    performanceMonitor: PerformanceMonitor,
    setLoading,
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
    errorHandlers: rendererErrorHandlers,
    getCoreModules: ensureCoreModules,
    isOpeningFileRef,
    logRenderer,
    removeEventListener: runtimeEnvironment.removeEventListener,
});

registerRendererApplicationLifecycle({
    cleanup,
    documentTarget: runtimeEnvironment.documentTarget,
    initializeApplication,
    setTimeout: runtimeEnvironment.setTimeout,
    windowTarget: runtimeEnvironment.rendererGlobal,
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
    runtimeEnvironment.rendererGlobal
);

installRendererElectronApiWiring({
    callUnknownFunction,
    electronApiCandidate: runtimeEnvironment.electronApiCandidate,
    ensureCoreModules,
    getFileInput: fileInputWiring.getFileInput,
    logRenderer,
    scheduleStateInitialization: scheduleImportTimeStateInitialization,
});

registerRendererTestOnlyBootstrap(testOnlyBootstrapOptions, {
    documentTarget: runtimeEnvironment.documentTarget,
    unloadTarget: runtimeEnvironment.rendererGlobal,
    windowTarget: runtimeEnvironment.rendererGlobal,
});

fileInputWiring.registerDelegatedFileInputChangeListener(
    runtimeEnvironment.documentTarget,
    runtimeEnvironment.rendererGlobal
);
