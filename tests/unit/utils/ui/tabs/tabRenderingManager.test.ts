import { beforeEach, describe, expect, it, vi } from "vitest";

const { runtimeState } = vi.hoisted(() => ({
    runtimeState: {
        dateNow: vi.fn(() => 1_000),
        performanceNow: vi.fn(() => 10),
    },
}));

vi.mock(
    "../../../../../electron-app/utils/ui/tabs/tabRenderingManagerRuntime.js",
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import("../../../../../electron-app/utils/ui/tabs/tabRenderingManagerRuntime.js")
            >();

        return {
            ...actual,
            getTabRenderingManagerRuntime: () => ({
                dateNow: runtimeState.dateNow,
                performanceNow: runtimeState.performanceNow,
            }),
        };
    }
);

const { tabRenderingManager } = await import(
    "../../../../../electron-app/utils/ui/tabs/tabRenderingManager.js"
);

function resetTrackedTabTimes(): void {
    tabRenderingManager.resetRenderTime("data");
    tabRenderingManager.resetRenderTime("map");
}

describe("tabRenderingManager", () => {
    beforeEach(() => {
        runtimeState.dateNow.mockReset();
        runtimeState.performanceNow.mockReset();
        runtimeState.dateNow.mockReturnValue(1_000);
        runtimeState.performanceNow.mockReturnValue(10);
        tabRenderingManager.cancelAllOperations();
        tabRenderingManager.setCurrentTab("data");
        resetTrackedTabTimes();
    });

    it("uses runtime clocks to skip renders that completed too recently", async () => {
        expect.assertions(4);

        runtimeState.performanceNow
            .mockReturnValueOnce(10)
            .mockReturnValueOnce(15);
        const firstOperation = vi.fn(() => "rendered");
        const secondOperation = vi.fn(() => "too soon");

        const view = await tabRenderingManager.executeRenderOperation(
            "data",
            firstOperation,
            { debounce: false }
        );
        const utils = await tabRenderingManager.executeRenderOperation(
            "data",
            secondOperation,
            { debounce: false }
        );

        expect({ utils, view }).toStrictEqual({
            utils: null,
            view: "rendered",
        });
        expect(runtimeState.dateNow).toHaveBeenCalledTimes(2);
        expect(runtimeState.performanceNow).toHaveBeenCalledTimes(2);
        expect(secondOperation).not.toHaveBeenCalled();
    });

    it("does not mark stale tab completions as recent renders", async () => {
        expect.assertions(3);

        runtimeState.performanceNow
            .mockReturnValueOnce(20)
            .mockReturnValueOnce(25)
            .mockReturnValueOnce(30)
            .mockReturnValueOnce(35);
        const staleOperation = vi.fn(() => {
            tabRenderingManager.setCurrentTab("map");
            return "stale";
        });
        const activeOperation = vi.fn(() => "active");

        const view = await tabRenderingManager.executeRenderOperation(
            "data",
            staleOperation,
            { debounce: false }
        );
        tabRenderingManager.setCurrentTab("data");
        const utils = await tabRenderingManager.executeRenderOperation(
            "data",
            activeOperation,
            { debounce: false }
        );

        expect({ utils, view }).toStrictEqual({
            utils: "active",
            view: null,
        });
        expect(runtimeState.dateNow).toHaveBeenCalledOnce();
        expect(activeOperation).toHaveBeenCalledOnce();
    });
});
