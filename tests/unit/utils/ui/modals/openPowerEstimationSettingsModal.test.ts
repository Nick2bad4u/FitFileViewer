import { beforeEach, describe, expect, it, vi } from "vitest";

type PowerEstimationSettings = {
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
type OnApply = () => void;
type ShowNotification = (message: string, level: string) => void;

const mockGetSettings = vi.fn<() => PowerEstimationSettings>();
const mockSetSettings = vi.fn<(settings: PowerEstimationSettings) => void>();
const mockShowNotification = vi.fn<ShowNotification>();

vi.mock(
    import("../../../../../electron-app/utils/data/processing/powerEstimationSettings.js"),
    () => ({
        getPowerEstimationSettings: mockGetSettings,
        setPowerEstimationSettings: mockSetSettings,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mockShowNotification,
    })
);

describe("openPowerEstimationSettingsModal.js", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
        mockGetSettings.mockReturnValue({
            enabled: true,
            riderWeightKg: 75,
            bikeWeightKg: 10,
            crr: 0.004,
            cda: 0.32,
            drivetrainEfficiency: 0.97,
            windSpeedMps: 0,
            gradeWindowMeters: 35,
            maxPowerW: 2000,
        } satisfies PowerEstimationSettings);
    });

    it("should render modal and close on Escape", async () => {
        expect.hasAssertions();

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = vi.fn<OnApply>();
        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        expect(document.body.textContent).toContain("Estimated Power");
        // Close with Escape
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(document.body.textContent).not.toContain("Estimated Power");
    });

    it("should show real power note when hasRealPower is true", async () => {
        expect.hasAssertions();

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        openPowerEstimationSettingsModal({
            hasRealPower: true,
            onApply: vi.fn<OnApply>(),
        });

        expect(document.body.textContent).toContain("contains real power data");
    });

    it("should validate rider weight and prevent apply", async () => {
        expect.hasAssertions();

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = vi.fn<OnApply>();
        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        // The first number input in the grid is rider weight.
        const inputs = Array.from(
            document.querySelectorAll<HTMLInputElement>("input[type='number']")
        );
        expect(inputs.length).toBeGreaterThan(0);
        inputs[0].value = "-1";

        const applyBtn = Array.from(
            document.querySelectorAll<HTMLButtonElement>("button")
        ).find((b) => b.textContent === "Apply");
        expect(applyBtn?.className).toBe("themed-btn");
        expect(applyBtn?.textContent).toBe("Apply");
        applyBtn?.click();

        expect(mockShowNotification).toHaveBeenCalledWith(
            expect.stringContaining("Rider weight"),
            "error"
        );
        expect(mockSetSettings).not.toHaveBeenCalled();
        expect(onApply).not.toHaveBeenCalled();

        // Modal should still be open
        expect(document.body.textContent).toContain("Estimated Power");
    });

    it("should persist settings and call onApply, then close", async () => {
        expect.hasAssertions();

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = vi.fn<OnApply>();
        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        const checkbox = document.querySelector<HTMLInputElement>(
            "input[type='checkbox']"
        );
        expect(checkbox?.checked).toBe(true);
        checkbox!.checked = false;

        const inputs = Array.from(
            document.querySelectorAll<HTMLInputElement>("input[type='number']")
        );
        // rider weight
        inputs[0].value = "80";

        const applyBtn = Array.from(
            document.querySelectorAll<HTMLButtonElement>("button")
        ).find((b) => b.textContent === "Apply");
        expect(applyBtn?.className).toBe("themed-btn");
        expect(applyBtn?.textContent).toBe("Apply");
        applyBtn?.click();

        expect(mockSetSettings).toHaveBeenCalledOnce();
        const saved = mockSetSettings.mock
            .calls[0][0] as PowerEstimationSettings;
        expect(saved.enabled).toBe(false);
        expect(saved.riderWeightKg).toBe(80);

        expect(onApply).toHaveBeenCalledOnce();
        expect(document.body.textContent).not.toContain("Estimated Power");
    });

    it("should close when clicking Cancel", async () => {
        expect.hasAssertions();

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        openPowerEstimationSettingsModal({
            hasRealPower: false,
            onApply: vi.fn<OnApply>(),
        });

        const cancelBtn = Array.from(
            document.querySelectorAll<HTMLButtonElement>("button")
        ).find((b) => b.textContent === "Cancel");
        expect(cancelBtn?.className).toBe("themed-btn");
        expect(cancelBtn?.textContent).toBe("Cancel");
        cancelBtn?.click();

        expect(document.body.textContent).not.toContain("Estimated Power");
    });

    it("should validate non-numeric CRR input and prevent apply", async () => {
        expect.hasAssertions();

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = vi.fn<OnApply>();
        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        const inputs = Array.from(
            document.querySelectorAll<HTMLInputElement>("input[type='number']")
        );
        // CRR is the third number input in the form.
        inputs[2].value = "abc";

        const applyBtn = Array.from(
            document.querySelectorAll<HTMLButtonElement>("button")
        ).find((b) => b.textContent === "Apply");
        expect(applyBtn?.className).toBe("themed-btn");
        expect(applyBtn?.textContent).toBe("Apply");
        applyBtn?.click();

        expect(mockShowNotification).toHaveBeenCalledWith(
            expect.stringContaining("Rolling Resistance"),
            "error"
        );
        expect(mockSetSettings).not.toHaveBeenCalled();
        expect(onApply).not.toHaveBeenCalled();
        expect(document.body.textContent).toContain("Estimated Power");
    });

    it("should close when clicking outside modal (overlay)", async () => {
        expect.hasAssertions();

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        openPowerEstimationSettingsModal({
            hasRealPower: false,
            onApply: vi.fn<OnApply>(),
        });
        const overlay = document.body.querySelector("div");
        expect(overlay).toBeInstanceOf(HTMLDivElement);

        overlay?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        expect(document.body.textContent).not.toContain("Estimated Power");
    });

    it("should catch errors thrown by onApply and still close", async () => {
        expect.hasAssertions();

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = () => {
            throw new Error("boom");
        };

        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        const applyBtn = Array.from(
            document.querySelectorAll<HTMLButtonElement>("button")
        ).find((b) => b.textContent === "Apply");
        expect(applyBtn?.className).toBe("themed-btn");
        expect(applyBtn?.textContent).toBe("Apply");
        applyBtn?.click();

        expect(document.body.textContent).not.toContain("Estimated Power");
    });
});
