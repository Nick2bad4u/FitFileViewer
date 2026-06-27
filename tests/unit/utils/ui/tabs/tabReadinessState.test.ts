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
        expect.assertions(3);

        const { setTabReadiness } =
            await import("../../../../../electron-app/utils/ui/tabs/tabReadinessState.js");

        expect(setTabReadiness("data", "loading", "test.source")).toBe(true);

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
        expect.assertions(3);

        const { setTabReadiness } =
            await import("../../../../../electron-app/utils/ui/tabs/tabReadinessState.js");

        expect(
            setTabReadiness(
                "zwift",
                "error",
                "test.error",
                new Error("blocked")
            )
        ).toBe(true);

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
        expect.assertions(3);

        const { setTabReadiness } =
            await import("../../../../../electron-app/utils/ui/tabs/tabReadinessState.js");

        expect(
            setTabReadiness("map", "blocked", "test.blocked", {
                reason: "missing FIT data",
            })
        ).toBe(true);

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

    it("rejects unknown tab readiness keys", async () => {
        expect.assertions(4);

        const warnSpy = vi.spyOn(console, "warn").mockReturnValue(undefined);
        const { setTabReadiness } =
            await import("../../../../../electron-app/utils/ui/tabs/tabReadinessState.js");

        expect(setTabReadiness("table", "ready", "test.unknown")).toBe(false);

        expect(stateEntries.has("ui.tabReadiness.table")).toBe(false);
        expect(mockSetState).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
            "[TabReadinessState] Ignoring unknown tab readiness key: table"
        );

        warnSpy.mockRestore();
    });
});
