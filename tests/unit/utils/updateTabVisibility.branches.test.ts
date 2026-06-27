import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type StateManagerShim = {
    getState: ReturnType<typeof vi.fn<(path?: string) => unknown>>;
    setState: ReturnType<
        typeof vi.fn<
            (
                path: string,
                value: unknown,
                options?: Record<string, unknown>
            ) => void
        >
    >;
    subscribe: ReturnType<typeof vi.fn<(path: string) => () => void>>;
};

async function setTabTestEnvironment(
    environment: Parameters<
        typeof import("../../../electron-app/utils/ui/tabs/tabTestEnvironment.js").setTabTestEnvironmentForTests
    >[0]
): Promise<void> {
    const { setTabTestEnvironmentForTests } =
        await import("../../../electron-app/utils/ui/tabs/tabTestEnvironment.js");
    setTabTestEnvironmentForTests(environment);
}

describe("updateTabVisibility - additional branches", () => {
    const contentIds = [
        "content_data",
        "content_chartjs",
        "content_browser",
        "content_map",
        "content_summary",
        "content_altfit",
        "content_zwift",
    ] as const;

    const createContentDom = () => {
        document.body.replaceChildren(
            ...contentIds.map((id) => {
                const element = document.createElement("div");
                element.id = id;
                return element;
            })
        );
    };

    const getRequiredElement = (id: string): HTMLElement => {
        const element = document.getElementById(id);

        if (!(element instanceof HTMLElement)) {
            throw new Error(`Expected #${id} to exist in the test DOM`);
        }

        return element;
    };

    beforeEach(() => {
        vi.resetModules();
        createContentDom();
        vi.doMock(
            import("../../../electron-app/utils/state/domain/fitFileState.js"),
            () => ({
                FitFileSelectors: {
                    getRawData: () => null,
                },
            })
        );
    });

    afterEach(async () => {
        await setTabTestEnvironment(null);
        vi.restoreAllMocks();
    });

    it("maps 'summary_content' pattern via extractTabNameFromContentId and sets activeTabContent", async () => {
        expect.assertions(3);

        // Provide working module exports so primary branch exercised
        const setState =
            vi.fn<
                (
                    path: string,
                    value: unknown,
                    options?: Record<string, unknown>
                ) => void
            >();
        const getState = vi.fn<(path?: string) => unknown>();
        const subscribe = vi.fn<(path: string) => () => void>();
        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({
                setState,
                getState,
                subscribe,
            })
        );

        const { updateTabVisibility } =
            await import("../../../electron-app/utils/ui/tabs/updateTabVisibility.js");

        updateTabVisibility("summary_content" as any);

        // Should derive 'summary' and set ui.activeTabContent accordingly
        expect(setState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "summary",
            { source: "updateTabVisibility" }
        );

        // Also verify display toggling behavior: summary visible, others hidden
        const summary = document.getElementById("content_summary")!;
        const data = document.getElementById("content_data")!;
        expect(summary.style.display).toBe("flex");
        expect(data.style.display).toBe("none");
    });

    it("ignores unknown content ids without showing tracked content", async () => {
        expect.assertions(9);

        const setState =
            vi.fn<
                (
                    path: string,
                    value: unknown,
                    options?: Record<string, unknown>
                ) => void
            >();
        const getState = vi.fn<(path?: string) => unknown>();
        const subscribe = vi.fn<(path: string) => () => void>();
        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({
                setState,
                getState,
                subscribe,
            })
        );

        const { updateTabVisibility } =
            await import("../../../electron-app/utils/ui/tabs/updateTabVisibility.js");

        updateTabVisibility("content_missing");

        expect(document.getElementById("content_missing")).not.toBeInstanceOf(
            HTMLElement
        );
        expect(setState).not.toHaveBeenCalled();
        for (const id of contentIds) {
            expect(getRequiredElement(id).style.display).toBe("none");
        }
    });

    it("falls back to the tab test state manager when module exports are unavailable", async () => {
        expect.assertions(3);

        // Mock module with missing methods to fail the primary branch
        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({})
        );

        const effSet =
            vi.fn<
                (
                    path: string,
                    value: unknown,
                    options?: Record<string, unknown>
                ) => void
            >();
        const effGet = vi.fn<(path?: string) => unknown>();
        const effSub = vi.fn<(path: string) => () => void>();
        await setTabTestEnvironment({
            stateManager: {
                setState: effSet,
                getState: effGet,
                subscribe: effSub,
            },
        });

        const { updateTabVisibility } =
            await import("../../../electron-app/utils/ui/tabs/updateTabVisibility.js");

        updateTabVisibility("content_map");

        expect(effSet).toHaveBeenCalledWith("ui.activeTabContent", "map", {
            source: "updateTabVisibility",
        });
        const map = document.getElementById("content_map")!;
        const summary = document.getElementById("content_summary")!;
        expect(map.style.display).toBe("flex");
        expect(summary.style.display).toBe("none");
    });
});
