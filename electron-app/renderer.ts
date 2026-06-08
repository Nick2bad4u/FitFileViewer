/**
 * @version 21.1.0
 *
 * @file Main renderer process entry point for FIT File Viewer Handles
 *   application initialization, module loading, and event setup
 *
 *   STATE MANAGEMENT MIGRATION: This file has been updated to use the new
 *   centralized state management system. The legacy appState object is
 *   maintained for backward compatibility but now proxies to the new state
 *   manager. Key changes:
 *
 *   1. Imports masterStateManager, appActions, and uiStateManager
 *   2. Initializes state management system before other components
 *   3. Uses appActions.setInitialized() instead of direct state mutation
 *   4. Uses showNotification() for consistent UI notifications
 *   5. Exposes state debugging utilities in development mode
 *
 *   Legacy components will continue to work through the appState proxy and
 *   isOpeningFileRef, but new code should use the state manager directly.
 */

// ==========================================
// Type Definitions
// ==========================================
// ==========================================
// Utility Imports & Fallbacks
// ==========================================

import { isDevelopmentMode } from "./utils/app/initialization/rendererEnvironment.js";
import { validateRendererDomElements } from "./renderer/domStartupValidation.js";
import {
    createRendererPerformanceMonitor,
    type RendererPerformanceMonitor,
} from "./renderer/startupPerformanceMonitor.js";
import {
    callUnknownFunction,
    ensureCoreModules,
    resolveExactManualMock,
    resolveManualMock,
    toModuleRecord,
} from "./renderer/coreModuleResolution.js";
import { installRendererElectronApiWiring } from "./renderer/electronApiWiring.js";
import { createRendererErrorEventHandlers } from "./renderer/errorHandling.js";
import { createRendererLifecycleCleanup } from "./renderer/lifecycleCleanup.js";
import { createRendererStateStartup } from "./renderer/stateManagerStartup.js";
import { createRendererApplicationStartup } from "./renderer/applicationStartup.js";
import { registerRendererApplicationLifecycle } from "./renderer/applicationLifecycleWiring.js";
import {
    createRendererImportTimeBootstrap,
    runRendererImportTimeBootstrap,
} from "./renderer/importTimeBootstrap.js";
import { installRendererGlobalSurfaces } from "./renderer/globalSurfacesWiring.js";
import { createRendererFileInputWiring } from "./renderer/fileInputWiring.js";
import { registerRendererTestOnlyBootstrap } from "./renderer/testOnlyBootstrap.js";
import { setLoading } from "./utils/ui/loading/syncRendererLoading.js";
// Avoid static import of AppActions because tests sometimes mock the module
// without exporting the named symbol. Always resolve via ensureCoreModules().
import { getState, subscribe } from "./utils/state/core/stateManager.js";
import { querySelectorByIdFlexible } from "./utils/ui/dom/elementIdUtils.js";
import { setupCreditsMarquee } from "./utils/ui/layout/enhanceCreditsSection.js";

type LogRendererLevel = "error" | "group" | "groupEnd" | "log" | "warn";

const rendererConsole = globalThis.console;

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
    getState,
    logRenderer,
    subscribe,
    toModuleRecord,
});
const {
    getAppState,
    initializeStateManager,
    isOpeningFileRef,
    resetStateInitializationForTests,
} = rendererStateStartup;

const importTimeBootstrap = createRendererImportTimeBootstrap({
    callUnknownFunction,
    ensureCoreModules,
    getOpenFileButton: () =>
        querySelectorByIdFlexible(document, "#open_file_btn"),
    initializeStateManager,
    isOpeningFileRef,
    resolveExactManualMock,
    resolveManualMock,
    setLoading,
    toModuleRecord,
});
const { scheduleImportTimeStateInitialization, scheduleImportTimeThemeSetup } =
    importTimeBootstrap;

const fileInputWiring = createRendererFileInputWiring({
    callUnknownFunction,
    ensureCoreModules,
    getFileInput: () =>
        querySelectorByIdFlexible(
            document,
            "#file_input"
        ) as HTMLInputElement | null,
    logRenderer,
    resolveExactManualMock,
    resolveManualMock,
    toModuleRecord,
});

const testOnlyBootstrapOptions = {
    callUnknownFunction,
    getOpenFileButton: () =>
        querySelectorByIdFlexible(document, "#open_file_btn"),
    isOpeningFileRef,
    resolveExactManualMock,
    resolveManualMock,
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
    addEventListener: globalThis.addEventListener.bind(globalThis),
    callUnknownFunction,
    ensureCoreModules,
    errorHandlers: rendererErrorHandlers,
    getFileInput: fileInputWiring.getFileInput,
    getOpenFileButton: () =>
        querySelectorByIdFlexible(document, "#open_file_btn"),
    initializeStateManager,
    isDevelopmentMode,
    isOpeningFileRef,
    logRenderer,
    performanceMonitor: PerformanceMonitor,
    setLoading,
    setupCreditsMarquee,
    validateDOMElements,
});

// ==========================================
// DOM Ready & Initialization
// ==========================================

/**
 * Validates that required DOM elements exist
 *
 * @returns {boolean} True if all required elements are present
 */
function validateDOMElements(): boolean {
    return validateRendererDomElements(document, logRenderer);
}

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
    getAppState,
    getCoreModules: ensureCoreModules,
    isOpeningFileRef,
    logRenderer,
    removeEventListener: globalThis.removeEventListener.bind(globalThis),
});

registerRendererApplicationLifecycle({
    cleanup,
    documentTarget: document,
    initializeApplication,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    windowTarget: globalThis,
});

installRendererGlobalSurfaces({
    appState: getAppState(),
    cleanup,
    ensureCoreModules,
    initializeApplication,
    isOpeningFileRef,
    logRenderer,
    performanceMonitor: PerformanceMonitor,
    resetStateInitializationForTests,
    validateDOMElements,
});

// ==========================================
// Immediate wiring for tests and basic environments
// ==========================================

runRendererImportTimeBootstrap(importTimeBootstrap);

// Attach file input change handler if present at import time (tests rely on this)
try {
    fileInputWiring.registerImportTimeFileInputChangeHandler(globalThis);
} catch {
    /* Ignore errors */
}

installRendererElectronApiWiring({
    addEventListener: globalThis.addEventListener.bind(globalThis),
    callUnknownFunction,
    clearInterval: globalThis.clearInterval.bind(globalThis),
    defineProperty: Object.defineProperty,
    ensureCoreModules,
    getFileInput: fileInputWiring.getFileInput,
    logRenderer,
    removeEventListener: globalThis.removeEventListener.bind(globalThis),
    scheduleStateInitialization: scheduleImportTimeStateInitialization,
    scope: globalThis,
    setInterval: globalThis.setInterval.bind(globalThis),
});

// Ensure mocked setupListeners and theme setup are invoked for event-based tests
try {
    registerRendererTestOnlyBootstrap(testOnlyBootstrapOptions, {
        documentTarget: document,
        unloadTarget: globalThis,
        windowTarget: globalThis,
    });
} catch {
    /* Ignore errors */
}

// Delegated change listener for dynamically created/replaced file input across tests
try {
    fileInputWiring.registerDelegatedFileInputChangeListener(
        document,
        globalThis
    );
} catch {
    /* Ignore errors */
}
