import { describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
    debouncedRender: vi.fn<(reason: string) => void>(),
    renderChartJS: vi.fn<() => void>(),
    setChartFieldVisibility:
        vi.fn<(field: string, visibility: "hidden" | "visible") => void>(),
    setChartSetting: vi.fn<(key: string, value: unknown) => void>(),
    showNotification: vi.fn<(message: string, type: string) => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
    () => ({
        getRegisteredChartStateManager: () => ({
            debouncedRender: h.debouncedRender,
        }),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/renderChartJS.js"),
    () => ({
        renderChartJS: h.renderChartJS,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        setChartFieldVisibility: h.setChartFieldVisibility,
        setChartSetting: h.setChartSetting,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: h.showNotification,
    })
);

function encodedConfig(value: unknown): string {
    return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

function resetTestState(): void {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
}

function restoreTestState(): void {
    vi.useRealTimers();
    window.history.replaceState({}, "", "/");
}

describe("loadSharedConfiguration", () => {
    it("does nothing when the URL has no shared chart config", async () => {
        expect.assertions(5);

        resetTestState();

        const { loadSharedConfiguration } =
            await import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js");

        expect(loadSharedConfiguration()).toBeUndefined();

        expect(h.setChartSetting).not.toHaveBeenCalled();
        expect(h.setChartFieldVisibility).not.toHaveBeenCalled();
        expect(h.showNotification).not.toHaveBeenCalled();
        expect(h.debouncedRender).not.toHaveBeenCalled();

        restoreTestState();
    });

    it("applies shared chart settings and normalized field visibility", async () => {
        expect.assertions(8);

        resetTestState();

        window.history.replaceState(
            {},
            "",
            `/?chartConfig=${encodeURIComponent(
                encodedConfig({
                    chartType: "line",
                    maxpoints: 1000,
                    visibleFields: {
                        cadence: "visible",
                        power: "hidden",
                        speed: false,
                    },
                })
            )}`
        );

        const { loadSharedConfiguration } =
            await import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js");

        expect(loadSharedConfiguration()).toBeUndefined();

        vi.runAllTimers();

        expect(h.setChartSetting).toHaveBeenCalledWith("chartType", "line");
        expect(h.setChartSetting).toHaveBeenCalledWith("maxpoints", 1000);

        expect(h.setChartFieldVisibility).toHaveBeenCalledWith(
            "cadence",
            "visible"
        );
        expect(h.setChartFieldVisibility).toHaveBeenCalledWith(
            "power",
            "hidden"
        );
        expect(h.setChartFieldVisibility).toHaveBeenCalledWith(
            "speed",
            "hidden"
        );
        expect(h.showNotification).toHaveBeenCalledWith(
            "Chart configuration loaded from URL",
            "success"
        );
        expect(h.debouncedRender).toHaveBeenCalledWith(
            "Configuration loaded from URL"
        );

        restoreTestState();
    });

    it("rejects invalid shared chart config payloads", async () => {
        expect.assertions(5);

        resetTestState();

        window.history.replaceState(
            {},
            "",
            `/?chartConfig=${encodeURIComponent(encodedConfig(["bad"]))}`
        );

        const { loadSharedConfiguration } =
            await import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js");

        expect(loadSharedConfiguration()).toBeUndefined();

        vi.runAllTimers();

        expect(h.setChartSetting).not.toHaveBeenCalled();
        expect(h.setChartFieldVisibility).not.toHaveBeenCalled();

        expect(h.showNotification).toHaveBeenCalledWith(
            "Failed to load shared configuration",
            "warning"
        );
        expect(h.debouncedRender).not.toHaveBeenCalled();

        restoreTestState();
    });
});
