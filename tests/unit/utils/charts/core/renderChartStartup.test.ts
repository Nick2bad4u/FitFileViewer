import { afterEach, describe, expect, it, vi } from "vitest";

import {
    isSharedConfigurationListenerRegistered,
    resetChartListenerStateForTests,
} from "../../../../../electron-app/utils/charts/core/chartListenerState.js";
import { registerChartStartup } from "../../../../../electron-app/utils/charts/core/renderChartStartup.js";
import type { RenderChartStartupRuntime } from "../../../../../electron-app/utils/charts/core/renderChartStartupRuntime.js";

function createRuntime(canRegister = true): RenderChartStartupRuntime & {
    listener?: EventListenerOrEventListenerObject;
} {
    const runtime: RenderChartStartupRuntime & {
        listener?: EventListenerOrEventListenerObject;
    } = {
        addDOMContentLoadedListener: vi.fn(
            (listener: EventListenerOrEventListenerObject) => {
                runtime.listener = listener;
            }
        ),
        canRegisterDOMContentLoadedListener: vi.fn(() => canRegister),
    };

    return runtime;
}

function dispatchCapturedListener(
    listener: EventListenerOrEventListenerObject | undefined
): void {
    if (typeof listener === "function") {
        listener(new Event("DOMContentLoaded"));
        return;
    }

    listener?.handleEvent(new Event("DOMContentLoaded"));
}

describe("registerChartStartup", () => {
    afterEach(() => {
        resetChartListenerStateForTests();
        vi.restoreAllMocks();
    });

    it("loads shared configuration on DOMContentLoaded and aborts the startup listener", () => {
        expect.assertions(5);

        const runtime = createRuntime();
        const loadSharedConfiguration = vi.fn<() => void>();

        registerChartStartup({
            loadSharedConfiguration,
            runtime,
        });

        expect(runtime.addDOMContentLoadedListener).toHaveBeenCalledWith(
            expect.any(Function),
            { once: true, signal: expect.any(AbortSignal) }
        );
        expect(isSharedConfigurationListenerRegistered()).toBe(true);

        dispatchCapturedListener(runtime.listener);

        expect(loadSharedConfiguration).toHaveBeenCalledOnce();
        expect(isSharedConfigurationListenerRegistered()).toBe(false);
        expect(
            runtime.canRegisterDOMContentLoadedListener
        ).toHaveBeenCalledOnce();
    });

    it("skips registration when startup runtime is unavailable or already registered", () => {
        expect.assertions(3);

        const unavailableRuntime = createRuntime(false);
        const registeredRuntime = createRuntime(true);

        registerChartStartup({
            loadSharedConfiguration: () => undefined,
            runtime: unavailableRuntime,
        });
        registerChartStartup({
            loadSharedConfiguration: () => undefined,
            runtime: registeredRuntime,
        });
        registerChartStartup({
            loadSharedConfiguration: () => undefined,
            runtime: registeredRuntime,
        });

        expect(
            unavailableRuntime.addDOMContentLoadedListener
        ).not.toHaveBeenCalled();
        expect(
            registeredRuntime.addDOMContentLoadedListener
        ).toHaveBeenCalledOnce();
        expect(isSharedConfigurationListenerRegistered()).toBe(true);
    });
});
