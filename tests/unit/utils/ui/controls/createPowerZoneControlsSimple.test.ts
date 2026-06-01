import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
    createPowerZoneControls,
    getPowerZoneVisibilitySettings,
    movePowerZoneControlsToSection,
    updatePowerZoneControlsVisibility,
} from "../../../../../electron-app/utils/ui/controls/createPowerZoneControlsSimple.js";
import { setChartFieldVisibility } from "../../../../../electron-app/utils/state/domain/settingsStateManager.js";

describe("createPowerZoneControlsSimple", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns existing controls when already present", () => {
        expect.assertions(2);

        const existing = document.createElement("div");
        existing.id = "power-zone-controls";
        document.body.append(existing);

        const parent = document.createElement("div");
        document.body.append(parent);

        const result = createPowerZoneControls(parent);
        expect(result).toBe(existing);
        expect(parent.contains(existing)).toBe(false);
    });

    it("creates controls section with collapse toggle and persists state", () => {
        expect.assertions(11);

        const parent = document.createElement("div");
        document.body.append(parent);

        const controls = createPowerZoneControls(parent);
        expect(parent.contains(controls)).toBe(true);

        const collapseBtn = controls.querySelector<HTMLButtonElement>(
            ".power-zone-collapse-btn"
        );
        const content = controls.querySelector<HTMLElement>(
            "#power-zone-content"
        );
        expect(collapseBtn).toBeInstanceOf(HTMLButtonElement);
        expect(content).toBeInstanceOf(HTMLDivElement);
        expect(collapseBtn?.getAttribute("aria-expanded")).toBe("true");
        expect(content?.style.maxHeight).toBe("500px");

        collapseBtn?.click();
        expect(localStorage.getItem("power-zone-controls-collapsed")).toBe(
            "true"
        );
        expect(collapseBtn?.getAttribute("aria-expanded")).toBe("false");
        expect(content?.style.maxHeight).toBe("0px");

        collapseBtn?.click();
        expect(localStorage.getItem("power-zone-controls-collapsed")).toBe(
            "false"
        );
        expect(collapseBtn?.textContent).toBe("▼");
        expect(content?.style.opacity).toBe("1");
    });

    it("applies hover styles when the section is hovered", () => {
        expect.assertions(4);

        const parent = document.createElement("div");
        document.body.append(parent);

        const controls = createPowerZoneControls(parent);

        controls.dispatchEvent(new Event("mouseenter"));
        expect(controls.style.borderColor).toBe("var(--color-primary-alpha)");
        expect(controls.style.boxShadow).toBe("var(--color-box-shadow)");

        controls.dispatchEvent(new Event("mouseleave"));
        expect(controls.style.borderColor).toBe("var(--color-border)");
        expect(controls.style.boxShadow).toBe("var(--color-box-shadow-light)");
    });

    it("initializes in collapsed state when stored preference exists", () => {
        expect.assertions(2);

        localStorage.setItem("power-zone-controls-collapsed", "true");

        const parent = document.createElement("div");
        document.body.append(parent);

        const controls = createPowerZoneControls(parent);
        const collapseBtn = controls.querySelector<HTMLButtonElement>(
            ".power-zone-collapse-btn"
        );
        const content = controls.querySelector<HTMLElement>(
            "#power-zone-content"
        );
        expect(collapseBtn?.getAttribute("aria-expanded")).toBe("false");
        expect(content?.style.maxHeight).toBe("0px");
    });

    it("moves power zone controls into dedicated section and adjusts spacing", () => {
        expect.assertions(5);

        const parent = document.createElement("div");
        document.body.append(parent);
        const controls = createPowerZoneControls(parent);
        const content = controls.querySelector<HTMLElement>(
            "#power-zone-content"
        );
        expect(content).toBeInstanceOf(HTMLDivElement);

        const existing = document.createElement("div");
        existing.textContent = "existing";
        content?.append(existing);

        const fieldContainer = document.createElement("div");
        const toggle = document.createElement("button");
        toggle.id = "field-toggle-power_zone_doughnut";
        fieldContainer.append(toggle);
        document.body.append(fieldContainer);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        movePowerZoneControlsToSection();

        expect(content?.contains(fieldContainer)).toBe(true);
        expect(logSpy).toHaveBeenCalledWith(
            "[PowerZoneControls] Moved power_zone_doughnut control to power zone section"
        );
        expect(logSpy).toHaveBeenCalledWith(
            "[PowerZoneControls] Successfully moved 1 power zone controls"
        );
        expect(fieldContainer.style.marginTop).toBe("12px");

        logSpy.mockRestore();
    });

    it("warns when the power zone content container is missing", () => {
        expect.assertions(2);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        movePowerZoneControlsToSection();

        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
            "[PowerZoneControls] Power zone content container not found"
        );
        expect(document.querySelector("#power-zone-content")).toBeNull();
    });

    it("does not log when no power zone toggles exist", () => {
        expect.assertions(2);

        const parent = document.createElement("div");
        document.body.append(parent);
        createPowerZoneControls(parent);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        movePowerZoneControlsToSection();

        expect(logSpy).not.toHaveBeenCalled();
        expect(
            document.querySelectorAll("#power-zone-content > *")
        ).toHaveLength(0);
    });

    it("updates controls visibility based on data availability", () => {
        expect.assertions(4);

        const parent = document.createElement("div");
        document.body.append(parent);
        const controls = createPowerZoneControls(parent);

        updatePowerZoneControlsVisibility(true);
        expect(controls.style.display).toBe("block");
        expect(controls.style.opacity).toBe("1");

        updatePowerZoneControlsVisibility(false);
        expect(controls.style.display).toBe("none");
        expect(controls.style.opacity).toBe("0.5");
    });

    it("reads power zone visibility preference from chart settings", () => {
        expect.assertions(2);

        const initialSettings = getPowerZoneVisibilitySettings() as {
            doughnutVisible: boolean;
        };
        expect(initialSettings.doughnutVisible).toBe(true);
        setChartFieldVisibility("power_zone_doughnut", "hidden");
        const updatedSettings = getPowerZoneVisibilitySettings() as {
            doughnutVisible: boolean;
        };
        expect(updatedSettings.doughnutVisible).toBe(false);
    });
});
