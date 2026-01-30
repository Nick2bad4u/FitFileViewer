import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApplyEstimatedPowerToRecords = vi.fn();
const mockHasPowerData = vi.fn();
const mockOpenModal = vi.fn();

type FitMesgValue = number | string | boolean | Date | null | undefined;
type FitMesg = Record<string, FitMesgValue>;

type Settings = {
    enabled: boolean;
    riderWeightKg: number;
    bikeWeightKg: number;
    crr: number;
    cda: number;
    drivetrainEfficiency: number;
    windSpeedMps: number;
    gradeWindowMeters: number;
    maxPowerW: number;
};

type ApplyArgs = {
    recordMesgs: Array<FitMesg>;
    sessionMesgs?: Array<FitMesg>;
    settings: Settings;
};

type ModalArgs = {
    hasRealPower: boolean;
    onApply: (s: Settings) => void;
};

vi.mock("../../../../../utils/data/processing/estimateCyclingPower.js", () => ({
    applyEstimatedPowerToRecords: (args: ApplyArgs) =>
        mockApplyEstimatedPowerToRecords(args),
    hasPowerData: (args: Array<FitMesg>) => mockHasPowerData(args),
}));

vi.mock(
    "../../../../../utils/ui/modals/openPowerEstimationSettingsModal.js",
    () => ({
        openPowerEstimationSettingsModal: (args: ModalArgs) =>
            mockOpenModal(args),
    })
);

describe("createPowerEstimationButton.js", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
    });

    it("should render the button and open modal on click", async () => {
        const { createPowerEstimationButton } =
            await import("../../../../../utils/ui/controls/createPowerEstimationButton.js");

        mockHasPowerData.mockReturnValue(false);

        const getData = () => ({
            recordMesgs: [],
            sessionMesgs: [],
            loadedFitFiles: [],
        });
        const onAfterApply = vi.fn();

        const btn = createPowerEstimationButton({ getData, onAfterApply });
        document.body.append(btn);

        expect(btn.textContent).toBe("⚡ Est Power");

        btn.click();

        expect(mockHasPowerData).toHaveBeenCalledWith([]);
        expect(mockOpenModal).toHaveBeenCalledTimes(1);

        const call = mockOpenModal.mock.calls[0][0] as ModalArgs;

        expect(call.hasRealPower).toBe(false);
        expect(typeof call.onApply).toBe("function");
    });

    it("should apply estimation to active + overlay records and call onAfterApply", async () => {
        const { createPowerEstimationButton } =
            await import("../../../../../utils/ui/controls/createPowerEstimationButton.js");

        mockHasPowerData.mockReturnValue(false);

        const activeRecords: Array<FitMesg> = [{}, {}];
        const overlayRecords1: Array<FitMesg> = [{}];
        const overlayRecords2: Array<FitMesg> = [{}];

        const getData = () => ({
            recordMesgs: activeRecords,
            sessionMesgs: [{ sport: "cycling" }],
            loadedFitFiles: [
                {
                    data: {
                        recordMesgs: overlayRecords1,
                        sessionMesgs: [{ sport: "cycling" }],
                    },
                },
                { data: { recordMesgs: overlayRecords2 } },
                // Duplicate array should not re-apply
                { data: { recordMesgs: activeRecords } },
            ],
        });

        const onAfterApply = vi.fn();

        // When modal opens, immediately invoke onApply with settings
        mockOpenModal.mockImplementation((args: ModalArgs) => {
            const a = args;
            a.onApply({
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            });
        });

        const btn = createPowerEstimationButton({ getData, onAfterApply });
        document.body.append(btn);
        btn.click();

        // Should apply to active + two overlays = 3 unique arrays
        expect(mockApplyEstimatedPowerToRecords).toHaveBeenCalledTimes(3);

        // Ensure at least one call used the active record array
        const arg0 = mockApplyEstimatedPowerToRecords.mock
            .calls[0][0] as ApplyArgs;
        expect(arg0.settings.maxPowerW).toBe(2000);

        expect(onAfterApply).toHaveBeenCalledTimes(1);
    });

    it("should pass hasRealPower=true to modal when power exists", async () => {
        const { createPowerEstimationButton } =
            await import("../../../../../utils/ui/controls/createPowerEstimationButton.js");

        mockHasPowerData.mockReturnValue(true);

        const getData = () => ({
            recordMesgs: [{ power: 200 }],
            sessionMesgs: [],
            loadedFitFiles: [],
        });

        const btn = createPowerEstimationButton({
            getData,
            onAfterApply: vi.fn(),
        });
        document.body.append(btn);

        btn.click();

        const call = mockOpenModal.mock.calls[0][0] as ModalArgs;
        expect(call.hasRealPower).toBe(true);
    });

    it("should be resilient to null/malformed getData and empty record arrays", async () => {
        const { createPowerEstimationButton } =
            await import("../../../../../utils/ui/controls/createPowerEstimationButton.js");

        mockHasPowerData.mockReturnValue(false);

        // When modal opens, immediately invoke onApply.
        mockOpenModal.mockImplementation((args: ModalArgs) => {
            args.onApply({
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            });
        });

        let callCount = 0;
        const getData = () => {
            callCount += 1;
            // First call (click): missing props exercises Array.isArray false branches.
            if (callCount === 1) return {};

            // Second call (apply): empty arrays exercise applyTo early return.
            return {
                recordMesgs: [],
                loadedFitFiles: [{ data: {} }],
            };
        };

        const onAfterApply = vi.fn();
        const btn = createPowerEstimationButton({ getData, onAfterApply });
        document.body.append(btn);

        btn.click();

        // applyTo should early-return on empty arrays and never call the estimator
        expect(mockApplyEstimatedPowerToRecords).not.toHaveBeenCalled();
        expect(onAfterApply).toHaveBeenCalledTimes(1);
    });
});
