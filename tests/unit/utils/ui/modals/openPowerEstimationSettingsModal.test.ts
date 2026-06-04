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
type OnApply = (settings: PowerEstimationSettings) => void;
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
        document.body.replaceChildren();
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

    function getDialog(): HTMLDivElement {
        const dialog = document.querySelector<HTMLDivElement>(
            "[role='dialog'][aria-modal='true']"
        );

        if (!dialog) {
            throw new Error("Missing power estimation settings dialog");
        }

        return dialog;
    }

    function getDialogState() {
        const dialog = getDialog(),
            describedBy = dialog.getAttribute("aria-describedby"),
            labelledBy = dialog.getAttribute("aria-labelledby");

        return {
            actionButtons: Array.from(
                dialog.querySelectorAll<HTMLButtonElement>("button"),
                (button) => ({
                    className: button.className,
                    text: button.textContent,
                    type: button.type,
                })
            ),
            ariaDescribedBy: describedBy,
            ariaLabelledBy: labelledBy,
            className: dialog.className,
            fieldNames: Array.from(
                dialog.querySelectorAll<HTMLInputElement>("input"),
                (input) => input.name
            ),
            note:
                describedBy === null
                    ? undefined
                    : document.getElementById(describedBy)?.textContent,
            role: dialog.getAttribute("role"),
            title:
                labelledBy === null
                    ? undefined
                    : document.getElementById(labelledBy)?.textContent,
        };
    }

    function getActionButton(text: "Apply" | "Cancel"): HTMLButtonElement {
        const button = Array.from(
            getDialog().querySelectorAll<HTMLButtonElement>("button")
        ).find((candidate) => candidate.textContent === text);

        if (!button) {
            throw new Error(`Missing ${text} button`);
        }

        return button;
    }

    function getNumberInput(name: string): HTMLInputElement {
        const input = getDialog().querySelector<HTMLInputElement>(
            `input[type='number'][name='${name}']`
        );

        if (!input) {
            throw new Error(`Missing ${name} input`);
        }

        return input;
    }

    function getEnabledInput(): HTMLInputElement {
        const input = getDialog().querySelector<HTMLInputElement>(
            "input[type='checkbox'][name='enabled']"
        );

        if (!input) {
            throw new Error("Missing enabled checkbox");
        }

        return input;
    }

    function isDialogOpen(): boolean {
        return document.querySelector("[role='dialog']") !== null;
    }

    it("should render modal and close on Escape", async () => {
        expect.assertions(3);

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = vi.fn<OnApply>();
        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        expect(document.body.firstElementChild?.className).toBe(
            "power-estimation-settings-overlay"
        );
        expect(getDialogState()).toStrictEqual({
            actionButtons: [
                { className: "themed-btn", text: "Cancel", type: "button" },
                { className: "themed-btn", text: "Apply", type: "button" },
            ],
            ariaDescribedBy: "power-estimation-settings-note",
            ariaLabelledBy: "power-estimation-settings-title",
            className: "power-estimation-settings-modal",
            fieldNames: [
                "enabled",
                "riderWeightKg",
                "bikeWeightKg",
                "crr",
                "cda",
                "drivetrainEfficiency",
                "windSpeedMps",
                "gradeWindowMeters",
                "maxPowerW",
            ],
            note: "This estimates power from speed + elevation/grade using a physics-based model (virtual power). Results are approximate.",
            role: "dialog",
            title: "⚡ Estimated Power (Experimental)",
        });
        // Close with Escape
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(isDialogOpen()).toBe(false);
    });

    it("should move focus into the modal and trap keyboard focus", async () => {
        expect.assertions(5);

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const launcher = document.createElement("button");
        launcher.textContent = "Open settings";
        document.body.append(launcher);
        launcher.focus();

        openPowerEstimationSettingsModal({
            hasRealPower: false,
            onApply: vi.fn<OnApply>(),
        });

        const apply = getActionButton("Apply"),
            cancel = getActionButton("Cancel"),
            firstInput = getEnabledInput();

        expect(document.activeElement).toBe(cancel);

        firstInput.focus();
        firstInput.dispatchEvent(
            new KeyboardEvent("keydown", {
                bubbles: true,
                cancelable: true,
                key: "Tab",
                shiftKey: true,
            })
        );
        expect(document.activeElement).toBe(apply);

        apply.dispatchEvent(
            new KeyboardEvent("keydown", {
                bubbles: true,
                cancelable: true,
                key: "Tab",
            })
        );
        expect(document.activeElement).toBe(firstInput);

        cancel.click();
        expect(isDialogOpen()).toBe(false);
        expect(mockSetSettings).not.toHaveBeenCalled();
    });

    it("should show real power note when hasRealPower is true", async () => {
        expect.assertions(1);

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        openPowerEstimationSettingsModal({
            hasRealPower: true,
            onApply: vi.fn<OnApply>(),
        });

        expect(getDialogState().note).toBe(
            "This file contains real power data. Estimated power will not be applied."
        );
    });

    it("should validate rider weight and prevent apply", async () => {
        expect.assertions(5);

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = vi.fn<OnApply>();
        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        getNumberInput("riderWeightKg").value = "-1";

        const applyBtn = getActionButton("Apply");
        expect({
            className: applyBtn.className,
            text: applyBtn.textContent,
            type: applyBtn.type,
        }).toStrictEqual({
            className: "themed-btn",
            text: "Apply",
            type: "button",
        });
        applyBtn.click();

        expect(mockShowNotification).toHaveBeenCalledWith(
            "Rider weight must be a positive number.",
            "error"
        );
        expect(mockSetSettings).not.toHaveBeenCalled();
        expect(onApply).not.toHaveBeenCalled();

        // Modal should still be open
        expect(isDialogOpen()).toBe(true);
    });

    it("should persist settings and call onApply, then close", async () => {
        expect.assertions(5);

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = vi.fn<OnApply>();
        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        const checkbox = getEnabledInput();
        expect(checkbox.checked).toBe(true);
        checkbox.checked = false;
        getNumberInput("riderWeightKg").value = "80";

        getActionButton("Apply").click();

        expect(mockSetSettings).toHaveBeenCalledOnce();
        const saved = mockSetSettings.mock
            .calls[0][0] as PowerEstimationSettings;
        expect({
            enabled: saved.enabled,
            riderWeightKg: saved.riderWeightKg,
        }).toStrictEqual({
            enabled: false,
            riderWeightKg: 80,
        });

        expect(onApply).toHaveBeenCalledOnce();
        expect(isDialogOpen()).toBe(false);
    });

    it("should close when clicking Cancel", async () => {
        expect.assertions(2);

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        openPowerEstimationSettingsModal({
            hasRealPower: false,
            onApply: vi.fn<OnApply>(),
        });

        const cancelBtn = getActionButton("Cancel");
        expect({
            className: cancelBtn.className,
            text: cancelBtn.textContent,
            type: cancelBtn.type,
        }).toStrictEqual({
            className: "themed-btn",
            text: "Cancel",
            type: "button",
        });
        cancelBtn.click();

        expect(isDialogOpen()).toBe(false);
    });

    it("should validate non-numeric CRR input and prevent apply", async () => {
        expect.assertions(4);

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = vi.fn<OnApply>();
        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        getNumberInput("crr").value = "abc";
        getActionButton("Apply").click();

        expect(mockShowNotification).toHaveBeenCalledWith(
            "Rolling Resistance must be at least 0.001.",
            "error"
        );
        expect(mockSetSettings).not.toHaveBeenCalled();
        expect(onApply).not.toHaveBeenCalled();
        expect(isDialogOpen()).toBe(true);
    });

    it("should close when clicking outside modal (overlay)", async () => {
        expect.assertions(2);

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        openPowerEstimationSettingsModal({
            hasRealPower: false,
            onApply: vi.fn<OnApply>(),
        });
        const overlay = document.querySelector(
            ".power-estimation-settings-overlay"
        );
        expect(overlay).toBeInstanceOf(HTMLDivElement);

        overlay?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        expect(isDialogOpen()).toBe(false);
    });

    it("should catch errors thrown by onApply and still close", async () => {
        expect.assertions(1);

        const { openPowerEstimationSettingsModal } =
            await import("../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js");

        const onApply = () => {
            throw new Error("boom");
        };

        openPowerEstimationSettingsModal({ hasRealPower: false, onApply });

        getActionButton("Apply").click();

        expect(isDialogOpen()).toBe(false);
    });
});
