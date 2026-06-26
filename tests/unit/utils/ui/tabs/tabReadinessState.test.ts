import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSetState, stateEntries } = vi.hoisted(() => ({
    mockSetState: vi.fn((stateKey: string, value: unknown) => {
        stateEntries.set(stateKey, value);
    }),
    stateEntries: new Map<string, unknown>(),
}));

vi.mock(
    "../../../../../electron-app/utils/ui/tabs/tabStateManagerSupport.js",
    () => ({
        getStateMgr: () => ({
            setState: mockSetState,
        }),
    })
);

vi.mock(
    "../../../../../electron-app/utils/ui/tabs/tabReadinessStateRuntime.js",
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import("../../../../../electron-app/utils/ui/tabs/tabReadinessStateRuntime.js")
            >();

        return {
            ...actual,
            getTabReadinessStateRuntime: () => ({
                now: () => 987_654,
            }),
        };
    }
);

describe("tabReadinessState", () => {
    beforeEach(() => {
        mockSetState.mockClear();
        stateEntries.clear();
    });

    it("writes explicit tab readiness entries to renderer state", async () => {
        expect.assertions(2);

        const { setTabReadiness } =
            await import("../../../../../electron-app/utils/ui/tabs/tabReadinessState.js");

        setTabReadiness("data", "loading", "test.source");

        expect(stateEntries.get("ui.tabReadiness.data")).toStrictEqual({
            error: null,
            status: "loading",
            updatedAt: 987_654,
        });
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.tabReadiness.data",
            {
                error: null,
                status: "loading",
                updatedAt: 987_654,
            },
            { source: "test.source" }
        );
    });

    it("normalizes Error details on failed readiness entries", async () => {
        expect.assertions(2);

        const { setTabReadiness } =
            await import("../../../../../electron-app/utils/ui/tabs/tabReadinessState.js");

        setTabReadiness("zwift", "error", "test.error", new Error("blocked"));

        expect(stateEntries.get("ui.tabReadiness.zwift")).toStrictEqual({
            error: "blocked",
            status: "error",
            updatedAt: 987_654,
        });
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.tabReadiness.zwift",
            {
                error: "blocked",
                status: "error",
                updatedAt: 987_654,
            },
            { source: "test.error" }
        );
    });

    it("normalizes non-Error details on blocked readiness entries", async () => {
        expect.assertions(2);

        const { setTabReadiness } =
            await import("../../../../../electron-app/utils/ui/tabs/tabReadinessState.js");

        setTabReadiness("map", "blocked", "test.blocked", {
            reason: "missing FIT data",
        });

        expect(stateEntries.get("ui.tabReadiness.map")).toStrictEqual({
            error: '{"reason":"missing FIT data"}',
            status: "blocked",
            updatedAt: 987_654,
        });
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.tabReadiness.map",
            {
                error: '{"reason":"missing FIT data"}',
                status: "blocked",
                updatedAt: 987_654,
            },
            { source: "test.blocked" }
        );
    });
});
