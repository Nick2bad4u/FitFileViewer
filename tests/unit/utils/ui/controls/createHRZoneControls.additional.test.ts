import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { setChartFieldVisibility } from "../../../../../electron-app/utils/state/domain/settingsStateManager.js";

const inlineSelectorMock = vi.hoisted(() => ({
    createInlineZoneColorSelector: vi.fn<
        (prefix: string, container: HTMLElement) => HTMLElement | null
    >((prefix: string, container: HTMLElement): HTMLElement | null => {
        const button = document.createElement("button");
        button.dataset.zonePrefix = prefix;
        container.append(button);
        return button;
    }),
}));

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createInlineZoneColorSelector.js"),
    () => inlineSelectorMock
);

async function loadModule() {
    return await import("../../../../../electron-app/utils/ui/controls/createHRZoneControls.js");
}

describe("createHRZoneControls additional coverage", () => {
    beforeEach(() => {
        const root = document.createElement("div");
        root.id = "root";
        const fields = document.createElement("div");
        fields.id = "fields";
        document.body.replaceChildren(root, fields);
        localStorage.clear();
        vi.resetModules();
        inlineSelectorMock.createInlineZoneColorSelector.mockReset();
        inlineSelectorMock.createInlineZoneColorSelector.mockImplementation(
            (prefix: string, container: HTMLElement) => {
                const button = document.createElement("button");
                button.dataset.zonePrefix = prefix;
                container.append(button);
                return button;
            }
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns existing controls without creating a new section", async () => {
        expect.assertions(2);

        const existing = document.createElement("div");
        existing.id = "hr-zone-controls";
        const root = document.getElementById("root")!;
        root.append(existing);
        const { createHRZoneControls } = await loadModule();
        const result = createHRZoneControls(root);
        expect(result).toBe(existing);
        expect(root.querySelectorAll("#hr-zone-controls")).toHaveLength(1);
    });

    it("honors persisted collapse state and updates hover styles", async () => {
        expect.assertions(6);

        localStorage.setItem("hr-zone-controls-collapsed", "true");
        const { createHRZoneControls } = await loadModule();
        const root = document.getElementById("root")!;
        const section = createHRZoneControls(root);
        const content = section.querySelector(
            "#hr-zone-content"
        ) as HTMLElement;
        const button = section.querySelector(
            ".hr-zone-collapse-btn"
        ) as HTMLButtonElement;
        expect(content.style.maxHeight).toBe("0px");
        expect(button.getAttribute("aria-expanded")).toBe("false");
        section.dispatchEvent(new Event("mouseenter"));
        expect(section.style.borderColor).toBe("var(--color-primary-alpha)");
        section.dispatchEvent(new Event("mouseleave"));
        expect(section.style.borderColor).toBe("var(--color-border)");
        button.click();
        expect(content.style.maxHeight).toBe("500px");
        expect(localStorage.getItem("hr-zone-controls-collapsed")).toBe(
            "false"
        );
    });

    it("getHRZoneVisibilitySettings reflects stored visibility flags", async () => {
        expect.assertions(1);

        setChartFieldVisibility("hr_zone_doughnut", "hidden");
        setChartFieldVisibility("hr_lap_zone_stacked", "hidden");
        const { getHRZoneVisibilitySettings } = await loadModule();
        const settings = getHRZoneVisibilitySettings();
        expect(settings).toEqual({
            doughnutVisible: false,
            lapIndividualVisible: true,
            lapStackedVisible: false,
        });
    });

    it("updateHRZoneControlsVisibility gracefully handles missing section", async () => {
        expect.assertions(1);

        const { updateHRZoneControlsVisibility } = await loadModule();
        document.body.replaceChildren();
        expect(() => updateHRZoneControlsVisibility(true)).not.toThrow();
    });

    it("warns when hr-zone-content is missing", async () => {
        expect.assertions(5);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { moveHRZoneControlsToSection } = await loadModule();
        const fields = document.getElementById("fields")!;
        const wrapper = document.createElement("div");
        const toggle = document.createElement("button");
        toggle.id = "field-toggle-hr_zone_doughnut";
        wrapper.append(toggle);
        fields.append(wrapper);
        moveHRZoneControlsToSection();
        expect(document.querySelector("#hr-zone-content")).toBeNull();
        expect(fields.children).toHaveLength(1);
        expect(fields.firstElementChild).toBe(wrapper);
        expect(
            inlineSelectorMock.createInlineZoneColorSelector
        ).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
            "[HRZoneControls] HR zone content container not found"
        );
        warnSpy.mockRestore();
    });

    it("moves controls, adds spacing, and appends unified color picker", async () => {
        expect.assertions(9);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const { createHRZoneControls, moveHRZoneControlsToSection } =
            await loadModule();
        const root = document.getElementById("root")!;
        const section = createHRZoneControls(root);
        const content = section.querySelector(
            "#hr-zone-content"
        ) as HTMLElement;
        const fields = document.getElementById("fields")!;
        for (const key of [
            "hr_zone_doughnut",
            "hr_lap_zone_stacked",
            "hr_lap_zone_individual",
        ]) {
            const wrapper = document.createElement("div");
            const toggle = document.createElement("button");
            toggle.id = `field-toggle-${key}`;
            wrapper.append(toggle);
            fields.append(wrapper);
        }
        moveHRZoneControlsToSection();
        expect(document.getElementById("fields")!.children).toHaveLength(0);
        expect(
            content.querySelectorAll("button[id^='field-toggle']")
        ).toHaveLength(3);
        const children = Array.from(content.children) as HTMLElement[];
        expect(children).toHaveLength(5);
        expect(children[1].style.marginTop).toBe("12px");
        const inlineButton = content.querySelector<HTMLButtonElement>(
            "button[data-zone-prefix='hr_zone']"
        );
        expect(inlineButton).toBeInstanceOf(HTMLButtonElement);
        expect(inlineButton?.dataset.zonePrefix).toBe("hr_zone");
        expect(inlineButton?.parentElement).toBe(children[4]);
        expect(
            inlineSelectorMock.createInlineZoneColorSelector
        ).toHaveBeenCalledWith("hr_zone", expect.any(HTMLElement));
        expect(logSpy).toHaveBeenCalledWith(
            "[HRZoneControls] Successfully moved 3 HR zone controls"
        );
        logSpy.mockRestore();
    });

    it("skips appending color picker when inline selector returns null", async () => {
        expect.assertions(2);

        inlineSelectorMock.createInlineZoneColorSelector.mockReturnValueOnce(
            null
        );
        const { createHRZoneControls, moveHRZoneControlsToSection } =
            await loadModule();
        const root = document.getElementById("root")!;
        const section = createHRZoneControls(root);
        const content = section.querySelector(
            "#hr-zone-content"
        ) as HTMLElement;
        const wrapper = document.createElement("div");
        const toggle = document.createElement("button");
        toggle.id = "field-toggle-hr_zone_doughnut";
        wrapper.append(toggle);
        document.getElementById("fields")!.append(wrapper);
        moveHRZoneControlsToSection();
        expect(content.children).toHaveLength(1);
        expect(
            content.querySelector("[data-zone-prefix='hr_zone']")
        ).toBeNull();
    });
});
