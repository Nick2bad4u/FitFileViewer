import { describe, expect, it, vi } from "vitest";

import { registerRendererApplicationLifecycle } from "../../../electron-app/renderer/applicationLifecycleWiring.js";
import { getRendererApplicationLifecycleWiringRuntime } from "../../../electron-app/renderer/applicationLifecycleWiringRuntime.js";

function createDocumentTarget(readyState: DocumentReadyState): Document {
    return {
        addEventListener: vi.fn(),
        readyState,
    } as unknown as Document;
}

function createWindowTarget(): Window {
    return {
        addEventListener: vi.fn(),
    } as unknown as Window;
}

describe("renderer application lifecycle wiring", () => {
    it("registers beforeunload cleanup and waits for DOMContentLoaded while loading", () => {
        expect.assertions(8);

        const lifecycleState = {
            cleanedUp: false,
            initialized: false,
        };
        const cleanup = vi.fn(() => {
            lifecycleState.cleanedUp = true;
        });
        const documentTarget = createDocumentTarget("loading");
        const initializeApplication = vi.fn(async () => {
            lifecycleState.initialized = true;
        });
        const setTimeoutSpy = vi.fn<typeof globalThis.setTimeout>();
        const windowTarget = createWindowTarget();

        registerRendererApplicationLifecycle({
            cleanup,
            documentTarget,
            initializeApplication,
            setTimeout: setTimeoutSpy,
            windowTarget,
        });

        expect(windowTarget.addEventListener).toHaveBeenCalledWith(
            "beforeunload",
            expect.any(Function),
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(documentTarget.addEventListener).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function),
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(setTimeoutSpy).not.toHaveBeenCalled();

        const onDOMContentLoaded = vi.mocked(documentTarget.addEventListener)
            .mock.calls[0]?.[1] as () => void;
        onDOMContentLoaded();

        expect(initializeApplication).toHaveBeenCalledOnce();
        expect(lifecycleState.initialized).toBe(true);
        expect(cleanup).not.toHaveBeenCalled();

        const onBeforeUnload = vi.mocked(windowTarget.addEventListener).mock
            .calls[0]?.[1] as () => void;
        onBeforeUnload();

        expect(cleanup).toHaveBeenCalledOnce();
        expect(lifecycleState.cleanedUp).toBe(true);
    });

    it("schedules initialization when the DOM is already ready", () => {
        expect.assertions(4);

        const delayedCallbacks: Array<() => void> = [];
        const documentTarget = createDocumentTarget("complete");
        const lifecycleState = {
            initialized: false,
        };
        const initializeApplication = vi.fn(async () => {
            lifecycleState.initialized = true;
        });
        const setTimeoutSpy = vi.fn<typeof globalThis.setTimeout>(
            (callback) => {
                delayedCallbacks.push(callback as () => void);
                return 1;
            }
        );

        registerRendererApplicationLifecycle({
            cleanup: vi.fn(),
            documentTarget,
            initializeApplication,
            setTimeout: setTimeoutSpy,
            windowTarget: createWindowTarget(),
        });

        expect(setTimeoutSpy).toHaveBeenCalledExactlyOnceWith(
            expect.any(Function),
            0
        );
        expect(initializeApplication).not.toHaveBeenCalled();
        expect(lifecycleState.initialized).toBe(false);

        delayedCallbacks[0]?.();

        expect(lifecycleState.initialized).toBe(true);
    });

    it("resolves cleanup abort controllers through the injected runtime", () => {
        expect.assertions(4);

        const abortController = new AbortController();
        const abort = vi.fn(() => {
            abortController.abort();
        });
        const lifecycleWiringAdapter = {
            createAbortController: vi.fn(() => ({
                abort,
                signal: abortController.signal,
            })),
        };
        const cleanup = vi.fn();
        const documentTarget = createDocumentTarget("loading");
        const windowTarget = createWindowTarget();

        registerRendererApplicationLifecycle({
            cleanup,
            documentTarget,
            initializeApplication: async () => {},
            runtime: lifecycleWiringAdapter,
            setTimeout: vi.fn<typeof globalThis.setTimeout>(),
            windowTarget,
        });
        const onBeforeUnload = vi.mocked(windowTarget.addEventListener).mock
            .calls[0]?.[1] as () => void;
        onBeforeUnload();

        expect(
            lifecycleWiringAdapter.createAbortController
        ).toHaveBeenCalledOnce();
        expect(cleanup).toHaveBeenCalledOnce();
        expect(abort).toHaveBeenCalledOnce();
        expect(abortController.signal.aborted).toBe(true);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererApplicationLifecycleWiringRuntime({});

        expect(() => {
            utils.createAbortController();
        }).toThrow(
            "renderer application lifecycle wiring requires an AbortController runtime"
        );
    });
});
