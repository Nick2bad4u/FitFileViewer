import { describe, it, expect, beforeEach } from "vitest";

async function loadModule() {
    return await import("../../../../../electron-app/utils/ui/controls/createHRZoneControls.js");
}

describe("createHRZoneControls", () => {
    beforeEach(() => {
        const root = document.createElement("div");
        root.id = "root";
        document.body.replaceChildren(root);
        localStorage.clear();
    });

    it("creates section and toggles collapse state", async () => {
        expect.assertions(10);

        const { createHRZoneControls } = await loadModule();
        const root = document.getElementById("root")!;
        const section = createHRZoneControls(root);
        expect(section.id).toBe("hr-zone-controls");
        const btn = section.querySelector(
            ".hr-zone-collapse-btn"
        ) as HTMLButtonElement;
        expect(btn).toBeInstanceOf(HTMLButtonElement);
        expect(btn.getAttribute("aria-expanded")).toBe("true");
        expect(btn.textContent).toBe("▼");

        // Default expanded -> collapse, then expand
        btn.click();
        const content = section.querySelector(
            "#hr-zone-content"
        ) as HTMLElement;
        expect(content).toBeInstanceOf(HTMLElement);
        expect(content.style.maxHeight).toBe("0px");
        expect(btn.getAttribute("aria-expanded")).toBe("false");
        expect(localStorage.getItem("hr-zone-controls-collapsed")).toBe("true");
        btn.click();
        expect(content.style.maxHeight).toBe("500px");
        expect(localStorage.getItem("hr-zone-controls-collapsed")).toBe(
            "false"
        );
    });

    it("updateHRZoneControlsVisibility toggles display", async () => {
        expect.assertions(2);

        const { createHRZoneControls, updateHRZoneControlsVisibility } =
            await loadModule();
        const root = document.getElementById("root")!;
        createHRZoneControls(root);
        updateHRZoneControlsVisibility(false);
        const controls = document.getElementById(
            "hr-zone-controls"
        ) as HTMLElement;
        expect(controls.style.display).toBe("none");
        updateHRZoneControlsVisibility(true);
        expect(controls.style.display).toBe("block");
    });

    it("updateHRZoneControlsVisibility does not create controls when missing", async () => {
        expect.assertions(2);

        const { updateHRZoneControlsVisibility } = await loadModule();

        expect(updateHRZoneControlsVisibility(true)).toBeUndefined();
        expect(document.getElementById("hr-zone-controls")).toBeNull();
    });
});
