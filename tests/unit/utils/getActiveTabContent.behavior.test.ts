import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getActiveTabContent } from "../../../electron-app/utils/rendering/helpers/getActiveTabContent.js";

function createTabContent({
    className = "tab-content",
    display,
    id,
}: {
    className?: string;
    display?: string;
    id?: string;
} = {}): HTMLDivElement {
    const element = document.createElement("div");
    element.className = className;
    if (id) {
        element.id = id;
    }
    if (display !== undefined) {
        element.style.display = display;
    }
    return element;
}

describe("getActiveTabContent behavior", () => {
    beforeEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.replaceChildren();
    });

    it("returns the first visible .tab-content element", () => {
        expect.assertions(4);

        const c1 = createTabContent({ display: "none" });
        const c2 = createTabContent({
            display: "block",
            id: "visible-tab",
        });
        const c3 = createTabContent({ display: "none" });
        document.body.append(c1, c2, c3);

        const active = getActiveTabContent();
        expect(active).toBe(c2);
        expect(active).toHaveProperty("id", "visible-tab");
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });

    it("returns null when no .tab-content elements are present and warns", () => {
        expect.assertions(2);

        const result = getActiveTabContent();
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalledWith(
            "[ActiveTabContent] No tab content elements found"
        );
    });

    it("returns null when none are visible (display not 'block')", () => {
        expect.assertions(3);

        for (let i = 0; i < 3; i++) {
            document.body.appendChild(
                createTabContent({
                    display: i === 0 ? "none" : "",
                })
            );
        }
        const result = getActiveTabContent();
        expect(result).toBeNull();
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });

    it("returns .tab-content.active when visible via CSS class (no inline display)", () => {
        expect.assertions(2);

        const inactive = createTabContent();
        const active = createTabContent({
            className: "tab-content active",
            id: "content_map",
        });

        document.body.append(inactive, active);

        const result = getActiveTabContent();
        expect(result).toBe(active);
        expect(console.error).not.toHaveBeenCalled();
    });

    it("derives active content from .tab-button.active id when needed", () => {
        expect.assertions(2);

        const btn = document.createElement("button");
        btn.id = "tab_summary";
        btn.className = "tab-button active";
        document.body.appendChild(btn);

        const content = createTabContent({ id: "content_summary" });
        document.body.appendChild(content);

        const result = getActiveTabContent();
        expect(result).toBe(content);
        expect(console.error).not.toHaveBeenCalled();
    });

    it("handles querySelectorAll throwing and returns null", () => {
        expect.assertions(2);

        const spy = vi
            .spyOn(document, "querySelectorAll")
            .mockImplementation(() => {
                throw new Error("boom");
            });
        const result = getActiveTabContent();
        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith(
            "[ActiveTabContent] Error getting active tab content:",
            new Error("boom")
        );
        spy.mockRestore();
    });
});
