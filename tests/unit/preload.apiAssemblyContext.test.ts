import { describe, expect, it, vi } from "vitest";
import { createPreloadApiAssemblyContext } from "../../electron-app/preload/apiAssemblyContext.js";

function createModules() {
    const validateCallback = vi.fn();
    const validateChannelName = vi.fn();
    const validateOptionalNonEmptyString = vi.fn();
    const validateRequiredNonEmptyString = vi.fn();
    const createSafeEventHandler = vi.fn();
    const createSafeInvokeHandler = vi.fn();
    const createSafeSendHandler = vi.fn();
    const removeIpcListener = vi.fn();
    const createPreloadValidators = vi.fn(() => ({
        validateCallback,
        validateChannelName,
        validateOptionalNonEmptyString,
        validateRequiredNonEmptyString,
    }));
    const createPreloadIpcHelpers = vi.fn(() => ({
        createSafeEventHandler,
        createSafeInvokeHandler,
        createSafeSendHandler,
        removeIpcListener,
    }));
    const shouldEnforceGenericIpcAllowlist = vi.fn(() => true);

    return {
        createPreloadIpcHelpers,
        createPreloadValidators,
        shouldEnforceGenericIpcAllowlist,
        validators: {
            validateCallback,
            validateChannelName,
            validateOptionalNonEmptyString,
            validateRequiredNonEmptyString,
        },
        helpers: {
            createSafeEventHandler,
            createSafeInvokeHandler,
            createSafeSendHandler,
            removeIpcListener,
        },
    };
}

describe("preload API assembly context", () => {
    it("builds shared domain context without process-specific IPC policy", () => {
        expect.assertions(5);

        const modules = createModules();
        const preloadLog = vi.fn();
        const ipcRenderer = {};
        const context = createPreloadApiAssemblyContext({
            constants: { CHANNELS: {}, DEFAULT_VALUES: {}, EVENTS: {} },
            contextBridge: null,
            ipcRenderer,
            modules,
            preloadLog,
        });

        expect(modules.createPreloadValidators).toHaveBeenCalledWith(
            preloadLog
        );
        expect(modules.createPreloadIpcHelpers).toHaveBeenCalledWith({
            ipcRenderer,
            preloadLog,
            validateCallback: modules.validators.validateCallback,
        });
        expect(context.shouldEnforceGenericIpcAllowlist).toBe(false);
        expect(context.createSafeSendHandler).toBe(
            modules.helpers.createSafeSendHandler
        );
        expect("processRef" in context).toBe(false);
    });

    it("adds process-specific generic IPC policy when processRef is provided", () => {
        expect.assertions(3);

        const modules = createModules();
        const processRef = { env: { NODE_ENV: "production" } };
        const context = createPreloadApiAssemblyContext({
            constants: { CHANNELS: {}, DEFAULT_VALUES: {}, EVENTS: {} },
            contextBridge: undefined,
            ipcRenderer: undefined,
            modules,
            preloadLog: vi.fn(),
            processRef,
        });

        expect(modules.shouldEnforceGenericIpcAllowlist).toHaveBeenCalledWith(
            processRef
        );
        expect(context.shouldEnforceGenericIpcAllowlist).toBe(true);
        expect(context.processRef).toBe(processRef);
    });
});
