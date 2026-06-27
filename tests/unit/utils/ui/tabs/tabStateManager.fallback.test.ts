// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ActivityData = {
    recordMesgs: Array<{ timestamp: number }>;
};

type GetState = (key: string) => ActivityData | null | string;
type RenderSummary = (activeFitData: ActivityData) => void;
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

const activeFitData: ActivityData = {
    recordMesgs: [{ timestamp: 1 }, { timestamp: 2 }],
};

const { mockRenderSummary } = vi.hoisted(() => ({
    mockRenderSummary: vi.fn<RenderSummary>(),
}));

const { effectiveStateManagerRef } = vi.hoisted(() => ({
    effectiveStateManagerRef: {
        current: null as EffectiveStateManager | null,
    },
}));

function noop(): void {
    return;
}

function getEffectiveStateManager(): EffectiveStateManager {
    const eff = effectiveStateManagerRef.current;
    if (!eff) {
        throw new Error("effective state manager was not installed");
    }
    return eff;
}

// This suite validates the tab state manager against the typed renderer state
// access seam instead of the retired tab test-environment fallback.

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getStateHistory: vi.fn<() => unknown[]>(() => []),
        getState: vi.fn<GetState>((key) => {
            const stateManager = effectiveStateManagerRef.current;
            return stateManager?.getState(key) ?? null;
        }),
        setState: undefined,
        updateState: undefined,
        subscribe: vi.fn<Subscribe>(() => noop),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/rendererStateManagerAccess.js"),
    () => ({
        getRendererCoreStateManager: vi.fn(
            () => effectiveStateManagerRef.current
        ),
        getRequiredRendererCoreStateManager: vi.fn(getEffectiveStateManager),
    })
);

vi.mock(
    "../../../../../electron-app/utils/rendering/core/renderSummary.js",
    () => ({
        renderSummary: mockRenderSummary,
    })
);

describe("tabStateManager.fallback", () => {
    beforeEach(async () => {
        vi.resetModules();
        mockRenderSummary.mockReset();
        mockRenderSummary.mockImplementation(noop);
        vi.spyOn(console, "log").mockImplementation(noop);
        vi.spyOn(console, "warn").mockImplementation(noop);
        vi.spyOn(console, "error").mockImplementation(noop);

        effectiveStateManagerRef.current = {
            getState: vi.fn<GetState>((key) => {
                if (key === "ui.activeTab") {
                    return "summary";
                }
                if (key === "summary.lastDataHash") {
                    return "";
                }
                if (key === "fitFile.rawData") {
                    return activeFitData;
                }
                return null;
            }),
            setState: vi.fn<SetState>(),
            subscribe: vi.fn<Subscribe>(() => noop),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        effectiveStateManagerRef.current = null;
    });

    it("uses typed renderer state-manager access and renders summary path", async () => {
        expect.assertions(6);

        const mod =
            await import("../../../../../electron-app/utils/ui/tabs/tabStateManager.js");
        const instance = mod.tabStateManager;

        await instance.handleTabSpecificLogic("summary");

        expect(mockRenderSummary).toHaveBeenCalledWith(activeFitData);
        // Verify setState through the fallback manager was called
        const eff = getEffectiveStateManager();
        expect(eff.setState).toHaveBeenCalledWith(
            "summary.lastDataHash",
            expect.any(String),
            { source: "TabStateManager.handleSummaryTab" }
        );

        // Also exercise switchToTab via fallback
        const switchedToMap = instance.switchToTab("map");
        expect(eff.setState).toHaveBeenCalledWith("ui.activeTab", "map", {
            source: "TabStateManager.switchToTab",
        });

        const switchedToMissingTab = instance.switchToTab("missing-tab");
        expect({
            switchedToMap,
            switchedToMissingTab,
        }).toStrictEqual({
            switchedToMap: true,
            switchedToMissingTab: false,
        });
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
