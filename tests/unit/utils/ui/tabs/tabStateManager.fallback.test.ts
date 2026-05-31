// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ActivityData = {
    recordMesgs: Array<{ timestamp: number }>;
};

type GetState = (key: string) => ActivityData | null | string;
type RenderSummary = (globalData: ActivityData) => void;
type SetState = (
    key: string,
    value: unknown,
    options?: { source?: string }
) => void;
type Subscribe = (...args: unknown[]) => () => void;
type EffectiveStateManager = {
    getState: ReturnType<typeof vi.fn<GetState>>;
    setState: ReturnType<typeof vi.fn<SetState>>;
    subscribe: ReturnType<typeof vi.fn<Subscribe>>;
};
type TestGlobal = typeof globalThis & {
    __vitest_effective_stateManager__?: EffectiveStateManager;
    renderSummary?: ReturnType<typeof vi.fn<RenderSummary>>;
};
type TestGlobalWithRenderSummary = typeof globalThis & {
    renderSummary: RenderSummary;
};

const globalData: ActivityData = {
    recordMesgs: [{ timestamp: 1 }, { timestamp: 2 }],
};

function noop(): void {
    return;
}

function noopRenderSummary(_globalData: ActivityData): void {
    return;
}

function getEffectiveStateManager(): EffectiveStateManager {
    // eslint-disable-next-line no-underscore-dangle
    const eff = (globalThis as TestGlobal).__vitest_effective_stateManager__;
    if (!eff) {
        throw new Error("effective state manager was not installed");
    }
    return eff;
}

// This suite specifically validates the getStateMgr() fallback path via
// __vitest_effective_stateManager__, independent of the normal module mocks.
// We avoid mocking the module path here; instead we inject the global and
// dynamically import the module under test.

// Mock the state manager module with missing/non-functional `subscribe` so getStateMgr() must use
// the __vitest_effective_stateManager__ fallback branch, while still providing the named exports
// required by transitive imports.
vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: undefined,
        setState: undefined,
        updateState: undefined,
        // Intentionally non-function so tabStateManager's getStateMgr() does not accept module exports.
        subscribe: vi.fn<Subscribe>(() => noop),
    })
);

describe("tabStateManager.fallback", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.spyOn(console, "log").mockImplementation(noop);
        vi.spyOn(console, "warn").mockImplementation(noop);
        vi.spyOn(console, "error").mockImplementation(noop);

        // Inject a minimal effective state manager
        // eslint-disable-next-line no-underscore-dangle
        (globalThis as TestGlobal).__vitest_effective_stateManager__ = {
            getState: vi.fn<GetState>((key) => {
                if (key === "ui.activeTab") {
                    return "summary";
                }
                if (key === "summary.lastDataHash") {
                    return "";
                }
                if (key === "globalData") {
                    return globalData;
                }
                return null;
            }),
            setState: vi.fn<SetState>(),
            subscribe: vi.fn<Subscribe>(() => noop),
        };

        Object.defineProperty(globalThis, "renderSummary", {
            configurable: true,
            value: noopRenderSummary,
            writable: true,
        });
        vi.spyOn(
            globalThis as TestGlobalWithRenderSummary,
            "renderSummary"
        ).mockImplementation(noopRenderSummary);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // eslint-disable-next-line no-underscore-dangle
        delete (globalThis as TestGlobal).__vitest_effective_stateManager__;
        delete (globalThis as TestGlobal).renderSummary;
    });

    it("uses global fallback state manager and renders summary path", async () => {
        expect.hasAssertions();

        const mod =
            await import("../../../../../electron-app/utils/ui/tabs/tabStateManager.js");
        const instance = mod.tabStateManager;

        await instance.handleTabSpecificLogic("summary");

        expect(
            (globalThis as TestGlobalWithRenderSummary).renderSummary
        ).toHaveBeenCalledWith(globalData);
        // Verify setState through the fallback manager was called
        const eff = getEffectiveStateManager();
        expect(eff.setState).toHaveBeenCalledWith(
            "summary.lastDataHash",
            expect.any(String),
            expect.objectContaining({
                source: expect.stringContaining(
                    "TabStateManager.handleSummaryTab"
                ),
            })
        );

        // Also exercise switchToTab via fallback
        const switchedToMap = instance.switchToTab("map");
        expect(switchedToMap).toBe(true);
        expect(eff.setState).toHaveBeenCalledWith(
            "ui.activeTab",
            "map",
            expect.objectContaining({
                source: expect.stringContaining("TabStateManager.switchToTab"),
            })
        );

        const switchedToMissingTab = instance.switchToTab("missing-tab");
        expect(switchedToMissingTab).toBe(false);
        expect(eff.setState).not.toHaveBeenCalledWith(
            "ui.activeTab",
            "missing-tab",
            expect.anything()
        );
        expect(console.warn).toHaveBeenCalledWith(
            "[TabStateManager] Unknown tab: missing-tab"
        );
    });
});
