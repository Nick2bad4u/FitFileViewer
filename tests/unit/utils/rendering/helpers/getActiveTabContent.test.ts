import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActiveTabContent } from "../../../../../electron-app/utils/rendering/helpers/getActiveTabContent.js";
import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";

function resetDom(): void {
    document.body.replaceChildren();
}

describe(getActiveTabContent, () => {
    beforeEach(() => {
        resetDom();
        stateManager.__resetStateManagerForTests();
    });

    it("prefers the first tab content with inline block display", () => {
        expect.assertions(1);

        const hidden = document.createElement("section");
        hidden.className = "tab-content";
        hidden.style.display = "none";

        const visible = document.createElement("section");
        visible.className = "tab-content";
        visible.style.display = "block";

        const laterVisible = document.createElement("section");
        laterVisible.className = "tab-content";
        laterVisible.style.display = "block";

        document.body.append(hidden, visible, laterVisible);

        expect(getActiveTabContent()).toBe(visible);
    });

    it("prefers visible active-tab state over stale active DOM classes", () => {
        expect.assertions(1);

        const staleSummary = document.createElement("section");
        staleSummary.className = "tab-content active";
        staleSummary.id = "content_summary";

        const activeMap = document.createElement("section");
        activeMap.className = "tab-content";
        activeMap.id = "content_map";
        activeMap.style.display = "flex";
        activeMap.setAttribute("aria-hidden", "false");

        document.body.append(staleSummary, activeMap);
        stateManager.setState("ui.activeTabContent", "map", {
            source: "test",
        });

        expect(getActiveTabContent()).toBe(activeMap);
    });

    it("falls back to active tab content without requiring inline styles", () => {
        expect.assertions(1);

        const inactive = document.createElement("section");
        inactive.className = "tab-content";

        const active = document.createElement("section");
        active.className = "tab-content active";

        document.body.append(inactive, active);

        expect(getActiveTabContent()).toBe(active);
    });

    it("falls back to aria-visible tab content", () => {
        expect.assertions(1);

        const hidden = document.createElement("section");
        hidden.className = "tab-content";
        hidden.setAttribute("aria-hidden", "true");

        const active = document.createElement("section");
        active.className = "tab-content";
        active.setAttribute("aria-hidden", "false");

        document.body.append(hidden, active);

        expect(getActiveTabContent()).toBe(active);
    });

    it("derives active content from active tab button id variants", () => {
        expect.assertions(1);

        const tabContent = document.createElement("section");
        tabContent.className = "tab-content";
        tabContent.id = "content_power_curve";

        const activeButton = document.createElement("button");
        activeButton.className = "tab-button active";
        activeButton.id = "tab-powerCurve";

        document.body.append(tabContent, activeButton);

        expect(getActiveTabContent()).toBe(tabContent);
    });

    it("returns null and warns when no tab content exists", () => {
        expect.assertions(2);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        try {
            expect(getActiveTabContent()).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(
                "[ActiveTabContent] No tab content elements found"
            );
        } finally {
            warnSpy.mockRestore();
        }
    });
});
