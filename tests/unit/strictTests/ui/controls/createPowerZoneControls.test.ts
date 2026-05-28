import { describe, it, expect, beforeEach } from "vitest";

async function loadModule() {
    return await import("../../../../../electron-app/utils/ui/controls/createPowerZoneControls.js");
}

describe("createPowerZoneControls", () => {
    beforeEach(() => {
        const root = document.createElement("div");
        root.id = "root";
        document.body.replaceChildren(root);
        localStorage.clear();
    });

    it("creates section and toggles collapse state", async () => {
        const { createPowerZoneControls } = await loadModule();
        const root = document.getElementById("root")!;
        const section = createPowerZoneControls(root);
        expect(section.id).toBe("power-zone-controls");
        const btn = section.querySelector(
            ".power-zone-collapse-btn"
        ) as HTMLButtonElement;
        expect(btn).toBeInstanceOf(HTMLButtonElement);
        expect(btn.getAttribute("aria-expanded")).toBe("true");
        const content = section.querySelector(
            "#power-zone-content"
        ) as HTMLElement;
        expect(content).toBeInstanceOf(HTMLElement);
        btn.click();
        expect(content.style.maxHeight).toBe("0px");
        expect(btn.getAttribute("aria-expanded")).toBe("false");
        expect(localStorage.getItem("power-zone-controls-collapsed")).toBe(
            "true"
        );
        btn.click();
        expect(content.style.maxHeight).toBe("500px");
        expect(btn.textContent).toBe("▼");
        expect(localStorage.getItem("power-zone-controls-collapsed")).toBe(
            "false"
        );
    });

    it("updatePowerZoneControlsVisibility toggles display", async () => {
        const { createPowerZoneControls, updatePowerZoneControlsVisibility } =
            await loadModule();
        const root = document.getElementById("root")!;
        createPowerZoneControls(root);
        updatePowerZoneControlsVisibility(false);
        const controls = document.getElementById(
            "power-zone-controls"
        ) as HTMLElement;
        expect(controls.style.display).toBe("none");
        updatePowerZoneControlsVisibility(true);
        expect(controls.style.display).toBe("block");
    });

    it("updatePowerZoneControlsVisibility does not create controls when missing", async () => {
        const { updatePowerZoneControlsVisibility } = await loadModule();

        expect(updatePowerZoneControlsVisibility(true)).toBeUndefined();
        expect(document.getElementById("power-zone-controls")).toBeNull();
    });
});
