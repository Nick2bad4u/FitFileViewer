/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/prefer-readonly-parameter-types, @typescript-eslint/strict-boolean-expressions, no-console, perfectionist/sort-modules, unicorn/prefer-top-level-await -- This file is the legacy global utility bridge; keep the unsafe global access quarantined here while the renderer moves to module imports. */
/**
 * Exposes utility functions globally for use in index.html and other scripts.
 *
 * Note: Exposing utilities globally is generally discouraged in modern
 * JavaScript development due to potential namespace pollution and security
 * risks. In Electron apps, this can make the application vulnerable to
 * cross-site scripting (XSS) attacks if untrusted content is loaded. This
 * approach is used here to simplify integration with the Electron app's
 * renderer process, where direct access to these utilities is required in
 * inline scripts.
 */

import { globalUtilities } from "./utils/legacy/globalUtilityRegistry.js";

/** Failed global utility attachment detail. */
export interface AttachmentResult {
    name: string;
    reason: string;
    type: string;
}

/** Summary of one global utility attachment pass. */
export interface AttachmentResults {
    collisions: CollisionResult[];
    failed: AttachmentResult[];
    successful: string[];
    total: number;
}

/** Namespace collision detected while attaching a utility to window. */
export interface CollisionResult {
    name: string;
    newType: string;
    previousType: string;
    resolved: boolean;
    serious: boolean;
}

/** Constants used by the legacy global utility bridge. */
export interface ConstantsType {
    ERRORS: {
        FUNCTION_NOT_AVAILABLE: string;
        INVALID_FUNCTION: string;
        NAMESPACE_COLLISION: string;
    };
    LOG_PREFIX: string;
    NAMESPACE: string;
    VERSION: string;
}

/** Public namespace exposed as globalThis.FitFileViewerUtils. */
export interface FitFileViewerUtilsApi {
    cleanup: () => void;
    getAvailableUtils: () => string[];
    getUtil: (name: string) => null | UtilityFunction;
    isUtilAvailable: (name: string) => boolean;
    readonly namespace: string;
    safeExecute: (utilName: string, ...args: unknown[]) => unknown;
    readonly utils: Record<string, UtilityFunction>;
    validateAllUtils: () => ValidationResults;
    readonly version: string;
}

/** Function shape exposed through the legacy global utility bridge. */
export type UtilityFunction = (...args: unknown[]) => unknown;

/** Validation summary for registered global utilities. */
export interface ValidationResults {
    invalid: string[];
    valid: string[];
}

type FitFileViewerGlobal = typeof globalThis & {
    devUtilsHelpers?: {
        cleanup: () => void;
        getAttachmentResults: () => AttachmentResults | undefined;
        logLevel: "debug";
        reattachUtils: () => AttachmentResults;
        validateUtils: () => ValidationResults;
    };
    electronAPI?: Partial<VersionElectronAPI>;
    FitFileViewerUtils?: FitFileViewerUtilsApi;
};

type NamedUtilityFunction = UtilityFunction & {
    readonly name: string;
};

interface VersionElectronAPI {
    getAppVersion: () => Promise<string>;
}

// Constants for better maintainability
const CONSTANTS: ConstantsType = {
    ERRORS: {
        FUNCTION_NOT_AVAILABLE: "Function is not available",
        INVALID_FUNCTION: "Invalid function provided",
        NAMESPACE_COLLISION: "Namespace collision detected",
    },
    LOG_PREFIX: "[utils.js]",
    NAMESPACE: "FitFileViewer",
    VERSION: "unknown", // Default version
};

// Version loading idempotency guards
let versionLoadStarted = false;
let versionLoadPromise: null | Promise<string> = null;
let electronAPICheckTimerId: ReturnType<typeof setTimeout> | undefined;
let attachUtilitiesTimerId: ReturnType<typeof setTimeout> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
}

function isNamedUtilityFunction(value: unknown): value is NamedUtilityFunction {
    return typeof value === "function";
}

function getVersionElectronAPI(): undefined | VersionElectronAPI {
    const api: unknown = Reflect.get(globalThis, "electronAPI");
    if (!isRecord(api)) {
        return undefined;
    }

    const getAppVersion = api["getAppVersion"];
    if (typeof getAppVersion !== "function") {
        return undefined;
    }

    return {
        getAppVersion: async () => String(await getAppVersion()),
    };
}

function getNodeEnvironment(): string | undefined {
    const processValue: unknown = Reflect.get(globalThis, "process");
    if (!isRecord(processValue)) {
        return undefined;
    }

    const env = processValue["env"];
    if (!isRecord(env)) {
        return undefined;
    }

    const nodeEnvironment = env["NODE_ENV"];
    return typeof nodeEnvironment === "string" ? nodeEnvironment : undefined;
}

function isFileProtocolWindow(): boolean {
    return (
        globalThis.window !== undefined &&
        globalThis.location.protocol === "file:"
    );
}

function isDevelopmentRuntime(): boolean {
    return getNodeEnvironment() === "development" || isFileProtocolWindow();
}

// Function to get version from electronAPI (idempotent)
async function loadVersionFromElectron(): Promise<string> {
    if (versionLoadStarted) {
        return versionLoadPromise ?? Promise.resolve(CONSTANTS.VERSION);
    }
    versionLoadStarted = true;
    // If a polling timer was set, cancel it since we're proceeding now
    if (typeof electronAPICheckTimerId === "number") {
        clearTimeout(electronAPICheckTimerId);
        electronAPICheckTimerId = undefined;
    }

    versionLoadPromise = (async () => {
        try {
            const electronAPI = getVersionElectronAPI();
            if (electronAPI) {
                const version = await electronAPI.getAppVersion();
                CONSTANTS.VERSION = version || "unknown";
                logWithContext(
                    "info",
                    `Version loaded from Electron: ${CONSTANTS.VERSION}`
                );
                return CONSTANTS.VERSION;
            }
            logWithContext(
                "warn",
                "electronAPI.getAppVersion not available, keeping default version"
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            logWithContext(
                "warn",
                "Failed to load version from Electron API:",
                { error: errorMessage }
            );
        }
        return CONSTANTS.VERSION;
    })();

    return versionLoadPromise;
}

// Initialize version asynchronously when electronAPI becomes available
if (globalThis.window !== undefined) {
    // Try immediately if electronAPI is already available
    if (getVersionElectronAPI()) {
        // Fire and forget - don't need to await
        void loadVersionFromElectron();
    } else {
        // Wait for electronAPI to be available
        const checkForElectronAPI = () => {
            if (versionLoadStarted) {
                // Already loading or loaded; stop polling
                electronAPICheckTimerId = undefined;
                return;
            }
            if (getVersionElectronAPI()) {
                // Fire and forget - don't need to await
                void loadVersionFromElectron();
            } else {
                // Keep checking periodically for a short time
                electronAPICheckTimerId = globalThis.setTimeout(
                    checkForElectronAPI,
                    100
                );
            }
        };
        electronAPICheckTimerId = globalThis.setTimeout(
            checkForElectronAPI,
            100
        );
    }
}

/**
 * Enhanced logging with context
 *
 * @param level - Log level.
 * @param message - Log message.
 * @param context - Additional context.
 */
function logWithContext(
    level: string,
    message: string,
    context: Record<string, unknown> = {}
): void {
    const timestamp = new Date().toISOString(),
        logMessage = `${timestamp} ${CONSTANTS.LOG_PREFIX} ${message}`;
    const logger =
        (console as unknown as Record<string, (...args: unknown[]) => void>)[
            level
        ] ?? console.log.bind(console);

    if (context && Object.keys(context).length > 0) {
        logger(logMessage, context);
    } else {
        logger(logMessage);
    }
}

/**
 * Validation functions
 *
 * @param fn - Function to validate.
 * @param name - Function name.
 *
 * @returns Whether the value is a valid utility function.
 */
function validateFunction(fn: unknown, name: string): fn is UtilityFunction {
    if (typeof fn !== "function") {
        logWithContext("error", `Invalid function: ${name}`, {
            type: typeof fn,
        });
        return false;
    }
    return true;
}

// List of utilities to expose globally with enhanced metadata
const utils = globalUtilities as Record<string, UtilityFunction>;

function recordFailedAttachment(
    results: AttachmentResults,
    name: string,
    reason: string,
    type: string
): void {
    results.failed.push({ name, reason, type });
}

function recordCollision(
    results: AttachmentResults,
    name: string,
    newType: string,
    previousType: string,
    serious: boolean
): void {
    results.collisions.push({
        name,
        newType,
        previousType,
        resolved: !serious,
        serious,
    });
}

function isSameNamedFunction(
    existingValue: (...args: unknown[]) => unknown,
    utility: UtilityFunction,
    utilityName: string
): boolean {
    return (
        existingValue.name === utility.name &&
        (existingValue.name === utilityName || existingValue.name === "")
    );
}

function handleUtilityCollision(
    results: AttachmentResults,
    utilityName: string,
    utility: UtilityFunction,
    existingValue: unknown
): boolean {
    if (existingValue === undefined || existingValue === null) {
        return false;
    }

    if (existingValue === utility) {
        results.successful.push(`${utilityName} (already attached)`);
        return true;
    }

    if (isNamedUtilityFunction(existingValue)) {
        if (isSameNamedFunction(existingValue, utility, utilityName)) {
            results.successful.push(`${utilityName} (updated)`);
            return false;
        }

        if (existingValue.toString() !== utility.toString()) {
            logWithContext(
                "info",
                `Function collision resolved for: ${utilityName}`,
                {
                    note: "Different implementations detected, using newer version",
                }
            );
        }
        recordCollision(
            results,
            utilityName,
            typeof utility,
            typeof existingValue,
            false
        );
        return false;
    }

    logWithContext("warn", `Type collision detected for: ${utilityName}`, {
        existing: typeof existingValue,
        new: typeof utility,
        overwriting: true,
    });
    recordCollision(
        results,
        utilityName,
        typeof utility,
        typeof existingValue,
        true
    );
    return false;
}

function attachUtilityToWindow(
    results: AttachmentResults,
    globalWindow: Record<string, unknown>,
    utilityName: string,
    utility: unknown
): void {
    results.total += 1;

    if (!validateFunction(utility, utilityName)) {
        recordFailedAttachment(
            results,
            utilityName,
            CONSTANTS.ERRORS.INVALID_FUNCTION,
            typeof utility
        );
        return;
    }

    if (
        handleUtilityCollision(
            results,
            utilityName,
            utility,
            globalWindow[utilityName]
        )
    ) {
        return;
    }

    try {
        globalWindow[utilityName] = utility;
        results.successful.push(utilityName);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        logWithContext("error", `Failed to attach function: ${utilityName}`, {
            error: errorMessage,
        });
        recordFailedAttachment(
            results,
            utilityName,
            errorMessage,
            typeof utility
        );
    }
}

function logAttachmentResults(results: AttachmentResults): void {
    logWithContext("info", "Utility attachment completed", {
        collisions: results.collisions.length,
        failed: results.failed.length,
        successful: results.successful.length,
        total: results.total,
    });

    if (isDevelopmentRuntime()) {
        if (results.failed.length > 0) {
            logWithContext("warn", "Failed attachments:", {
                failed: results.failed,
            });
        }

        const seriousCollisions = results.collisions.filter(
            (collision) => collision.serious
        );
        if (seriousCollisions.length > 0) {
            logWithContext("warn", "Serious namespace collisions:", {
                collisions: seriousCollisions,
            });
        }
    }
}

// Enhanced global attachment with validation and error handling
function attachUtilitiesToWindow(): AttachmentResults {
    const globalWindow = getGlobalWindowRecord();
    const attachmentResults: AttachmentResults = {
        collisions: [],
        failed: [],
        successful: [],
        total: 0,
    };

    try {
        for (const [key, fn] of Object.entries(utils)) {
            attachUtilityToWindow(attachmentResults, globalWindow, key, fn);
        }

        logAttachmentResults(attachmentResults);
        return attachmentResults;
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        logWithContext("error", "Critical error during utility attachment:", {
            error: errorMessage,
        });
        return {
            collisions: [],
            failed: [{ name: "ALL", reason: errorMessage, type: "unknown" }],
            successful: [],
            total: Object.keys(utils).length,
        };
    }
}

function getGlobalWindowRecord(): Record<string, unknown> {
    return globalThis.window as unknown as Record<string, unknown>;
}

function hasUtility(name: string): boolean {
    return Object.keys(utils).includes(name);
}

// Enhanced namespace management
const FitFileViewerUtils: FitFileViewerUtilsApi = {
    // Cleanup function
    cleanup: () => {
        if (attachUtilitiesTimerId !== undefined) {
            clearTimeout(attachUtilitiesTimerId);
            attachUtilitiesTimerId = undefined;
        }

        const globalWindow = getGlobalWindowRecord();
        for (const key of Object.keys(utils)) {
            try {
                Reflect.deleteProperty(globalWindow, key);
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                logWithContext("error", `Failed to cleanup utility: ${key}`, {
                    error: errorMessage,
                });
            }
        }
        logWithContext("info", "Utils cleanup completed");
    },

    // Utility management functions
    getAvailableUtils: () => Object.keys(utils),
    /**
     * @param name - Utility name.
     *
     * @returns The utility function or null.
     */
    getUtil: (name: string) => {
        if (!FitFileViewerUtils.isUtilAvailable(name)) {
            logWithContext("error", `Utility not available: ${name}`);
            return null;
        }
        return utils[name] ?? null;
    },

    /**
     * @param name - Utility name.
     *
     * @returns Whether the utility is available.
     */
    isUtilAvailable: (name: string) =>
        hasUtility(name) && validateFunction(utils[name], name),

    namespace: CONSTANTS.NAMESPACE,
    // Safe utility execution
    /**
     * @param utilName - Utility name.
     * @param args - Arguments to pass.
     *
     * @returns Result of utility execution.
     */
    safeExecute: (utilName: string, ...args: unknown[]) => {
        const util = FitFileViewerUtils.getUtil(utilName);
        if (!util) {
            throw new Error(
                `${CONSTANTS.ERRORS.FUNCTION_NOT_AVAILABLE}: ${utilName}`
            );
        }

        try {
            return util(...args);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            logWithContext("error", `Error executing utility: ${utilName}`, {
                args: args.length,
                error: errorMessage,
            });
            throw error;
        }
    },

    // Core utilities object
    utils,

    // Development helpers
    validateAllUtils: () => {
        const results: ValidationResults = { invalid: [], valid: [] };
        for (const [key, fn] of Object.entries(utils)) {
            if (validateFunction(fn, key)) {
                results.valid.push(key);
            } else {
                results.invalid.push(key);
            }
        }
        return results;
    },

    // Metadata with dynamic version getter
    get version() {
        return CONSTANTS.VERSION;
    },
};

// Attach utilities to window after imports are loaded
let attachmentResults: AttachmentResults | undefined;
attachUtilitiesTimerId = setTimeout(() => {
    attachmentResults = attachUtilitiesToWindow();
    attachUtilitiesTimerId = undefined;
}, 0);

// Expose the utils namespace for advanced usage
(globalThis as FitFileViewerGlobal).FitFileViewerUtils = FitFileViewerUtils;

// Development mode enhancements
const isDevelopment =
    getNodeEnvironment() === "development" || isFileProtocolWindow();
if (isDevelopment) {
    // Expose additional development helpers
    (globalThis as FitFileViewerGlobal).devUtilsHelpers = {
        cleanup: FitFileViewerUtils.cleanup,
        getAttachmentResults: () => attachmentResults,
        logLevel: "debug",
        reattachUtils: attachUtilitiesToWindow,
        validateUtils: FitFileViewerUtils.validateAllUtils,
    };

    logWithContext(
        "info",
        "Development helpers exposed on window.devUtilsHelpers"
    );
}

// Report successful initialization
logWithContext(
    "info",
    `Utils module initialized successfully (v${CONSTANTS.VERSION})`
);

// Export for module usage (if needed)
export default utils;
export { FitFileViewerUtils, CONSTANTS as UTILS_CONSTANTS };
/* eslint-enable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/prefer-readonly-parameter-types, @typescript-eslint/strict-boolean-expressions, no-console, perfectionist/sort-modules, unicorn/prefer-top-level-await -- End legacy global utility bridge quarantine. */
