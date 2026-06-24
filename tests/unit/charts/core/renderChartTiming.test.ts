import { afterEach, describe, expect, it, vi } from "vitest";

import { createRenderTimingGate as createTimingGate } from "../../../../electron-app/utils/charts/core/renderChartTiming.js";
import type { RenderChartTimerRuntime } from "../../../../electron-app/utils/charts/core/renderChartTimerRuntime.js";

function createRuntime(): RenderChartTimerRuntime {
    return {
        clearTimeout: vi.fn(),
        dateNow: vi.fn<() => number>(),
        setTimeout: vi.fn(),
        wait: vi.fn<() => Promise<void>>(() => Promise.resolve()),
        waitForNextTask: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    };
}

describe("createRenderTimingGate", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("waits through the timer runtime when renders happen too quickly", async () => {
        expect.assertions(2);

        const runtime = createRuntime();
        vi.mocked(runtime.dateNow)
            .mockReturnValueOnce(1_000)
            .mockReturnValueOnce(1_050);
        const gate = createTimingGate(200, runtime);

        await gate.waitIfRapidRender();
        await gate.waitIfRapidRender();

        expect(runtime.wait).toHaveBeenCalledExactlyOnceWith(200);
        expect(runtime.waitForNextTask).not.toHaveBeenCalled();
    });
});
