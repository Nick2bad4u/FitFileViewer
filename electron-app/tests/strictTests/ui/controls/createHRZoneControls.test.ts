import { describe, it, expect, beforeEach } from "vitest";

async function loadModule() {
    return await import("../../../../utils/ui/controls/createHRZoneControls.js");
}

describe("createHRZoneControls", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        localStorage.clear();
    });

    it("creates section and toggles collapse state", async () => {
        const { createHRZoneControls } = await loadModule();
        const root = document.getElementById("root")!;
        const section = createHRZoneControls(root);
        expect(section.id).toBe("hr-zone-controls");
        const btn = section.querySelector(".hr-zone-collapse-btn") as HTMLButtonElement;
        expect(btn).toBeTruthy();

        // Default expanded -> collapse, then expand
        btn.click();
        const content = section.querySelector("#hr-zone-content") as HTMLElement;
        expect(content.style.maxHeight).toBe("0");
        btn.click();
        expect(content.style.maxHeight).toBe("500px");
    });

    it("updateHRZoneControlsVisibility toggles display", async () => {
        const { createHRZoneControls, updateHRZoneControlsVisibility } = await loadModule();
        const root = document.getElementById("root")!;
        createHRZoneControls(root);
        updateHRZoneControlsVisibility(false);
        const controls = document.getElementById("hr-zone-controls") as HTMLElement;
        expect(controls.style.display).toBe("none");
        updateHRZoneControlsVisibility(true);
        expect(controls.style.display).toBe("block");
    });
});
