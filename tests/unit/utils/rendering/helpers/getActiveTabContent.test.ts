import { describe, expect, it, vi } from "vitest";
import { getActiveTabContent } from "../../../../../electron-app/utils/rendering/helpers/getActiveTabContent.js";

function resetDom(): void {
    document.body.replaceChildren();
}

describe(getActiveTabContent, () => {
    it("prefers the first tab content with inline block display", () => {
        expect.assertions(1);

        resetDom();

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

    it("falls back to active tab content without requiring inline styles", () => {
        expect.assertions(1);

        resetDom();

        const inactive = document.createElement("section");
        inactive.className = "tab-content";

        const active = document.createElement("section");
        active.className = "tab-content active";

        document.body.append(inactive, active);

        expect(getActiveTabContent()).toBe(active);
    });

    it("falls back to aria-visible tab content", () => {
        expect.assertions(1);

        resetDom();

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

        resetDom();

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

        resetDom();
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
