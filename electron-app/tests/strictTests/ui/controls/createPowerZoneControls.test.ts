import { describe, it, expect, beforeEach } from "vitest";

async function loadModule() {
    return await import("../../../../utils/ui/controls/createPowerZoneControls.js");
}

describe("createPowerZoneControls", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
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
        expect(btn).toBeTruthy();
        const content = section.querySelector(
            "#power-zone-content"
        ) as HTMLElement;
        btn.click();
        expect(content.style.maxHeight).toBe("0");
        btn.click();
        expect(content.style.maxHeight).toBe("500px");
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
});
