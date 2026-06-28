import { describe, expect, it, vi } from "vitest";

import type { PowerEstimationSettings } from "../../../../../electron-app/utils/data/processing/estimateCyclingPower.js";

const mocks = vi.hoisted(() => ({
    applyEstimatedPowerToRecords:
        vi.fn<
            (params: {
                recordMesgs: Record<string, unknown>[];
                sessionMesgs?: Record<string, unknown>[];
                settings: PowerEstimationSettings;
            }) => unknown
        >(),
    hasPowerData: vi.fn<(records: Record<string, unknown>[]) => boolean>(),
    openPowerEstimationSettingsModal:
        vi.fn<
            (params: {
                hasRealPower: boolean;
                onApply: (settings: PowerEstimationSettings) => void;
            }) => void
        >(),
    loadedFitFiles: [] as {
        data?: {
            recordMesgs?: Record<string, unknown>[];
            sessionMesgs?: Record<string, unknown>[];
        };
    }[],
}));

vi.mock(
    import("../../../../../electron-app/utils/data/processing/estimateCyclingPower.js"),
    () => ({
        applyEstimatedPowerToRecords: mocks.applyEstimatedPowerToRecords,
        hasPowerData: mocks.hasPowerData,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js"),
    () => ({
        openPowerEstimationSettingsModal:
            mocks.openPowerEstimationSettingsModal,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/state/domain/loadedFitFilesState.js"),
    () => ({
        getLoadedFitFiles: vi.fn(() => mocks.loadedFitFiles),
    })
);

import { createPowerEstimationButton } from "../../../../../electron-app/utils/ui/controls/createPowerEstimationButton.js";

const SETTINGS = {
    bikeWeightKg: 9,
    cda: 0.32,
    crr: 0.005,
    drivetrainEfficiency: 0.97,
    enabled: true,
    gradeWindowMeters: 25,
    maxPowerW: 1200,
    riderWeightKg: 75,
    windSpeedMps: 0,
} as const satisfies PowerEstimationSettings;

function resetMocks(): void {
    vi.clearAllMocks();
    document.body.replaceChildren();
    mocks.hasPowerData.mockReturnValue(false);
    mocks.loadedFitFiles = [];
}

function getModalApplyCallback(): (settings: PowerEstimationSettings) => void {
    const firstCall = mocks.openPowerEstimationSettingsModal.mock.calls[0];
    if (!firstCall) {
        throw new Error("Settings modal was not opened");
    }

    return firstCall[0].onApply;
}

describe(createPowerEstimationButton, () => {
    it("creates the expected map action button", () => {
        expect.assertions(4);

        resetMocks();

        const button = createPowerEstimationButton({
            getData: () => null,
            onAfterApply: vi.fn<() => void>(),
        });

        expect(button.type).toBe("button");
        expect(button.className).toBe("map-action-btn");
        expect(button.title).toBe("Estimated power settings");
        expect(button.textContent).toBe("⚡ Est Power");
    });

    it("opens the settings modal with the current real-power state", () => {
        expect.assertions(3);

        resetMocks();
        const records = [{ power: 220 }];
        mocks.hasPowerData.mockReturnValue(true);

        const button = createPowerEstimationButton({
            getData: () => ({ recordMesgs: records }),
            onAfterApply: vi.fn<() => void>(),
        });

        button.click();

        expect(mocks.hasPowerData).toHaveBeenCalledExactlyOnceWith(records);
        expect(mocks.openPowerEstimationSettingsModal).toHaveBeenCalledOnce();
        expect(
            String(
                mocks.openPowerEstimationSettingsModal.mock.calls[0]?.[0]
                    .hasRealPower
            )
        ).toBe("true");
    });

    it("applies settings to the active file and each overlay once", () => {
        expect.assertions(6);

        resetMocks();
        const activeRecords = [{ enhanced_speed: 8 }];
        const activeSession = [{ sport: "cycling" }];
        const overlayRecords = [{ enhanced_speed: 9 }];
        const overlaySession = [{ sport: "cycling" }];
        const duplicateOverlay = { recordMesgs: activeRecords };
        const onAfterApply = vi.fn<() => void>();
        mocks.loadedFitFiles = [
            {
                data: {
                    recordMesgs: overlayRecords,
                    sessionMesgs: overlaySession,
                },
            },
            { data: duplicateOverlay },
            { data: { recordMesgs: [] } },
        ];

        const button = createPowerEstimationButton({
            getData: () => ({
                recordMesgs: activeRecords,
                sessionMesgs: activeSession,
            }),
            onAfterApply,
        });

        button.click();
        getModalApplyCallback()(SETTINGS);

        expect(button.textContent).toBe("⚡ Est Power");
        expect(mocks.applyEstimatedPowerToRecords).toHaveBeenCalledTimes(2);
        expect(mocks.applyEstimatedPowerToRecords).toHaveBeenNthCalledWith(1, {
            recordMesgs: activeRecords,
            sessionMesgs: activeSession,
            settings: SETTINGS,
        });
        expect(mocks.applyEstimatedPowerToRecords).toHaveBeenNthCalledWith(2, {
            recordMesgs: overlayRecords,
            sessionMesgs: overlaySession,
            settings: SETTINGS,
        });
        expect(onAfterApply).toHaveBeenCalledOnce();
        expect(mocks.openPowerEstimationSettingsModal).toHaveBeenCalledOnce();
    });

    it("still runs the completion callback when no records are present", () => {
        expect.assertions(3);

        resetMocks();
        const onAfterApply = vi.fn<() => void>();

        const button = createPowerEstimationButton({
            getData: () => null,
            onAfterApply,
        });

        button.click();
        getModalApplyCallback()(SETTINGS);

        expect(button.className).toBe("map-action-btn");
        expect(mocks.applyEstimatedPowerToRecords).not.toHaveBeenCalled();
        expect(onAfterApply).toHaveBeenCalledOnce();
    });
});
