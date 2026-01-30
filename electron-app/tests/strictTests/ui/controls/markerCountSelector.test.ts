import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../utils/charts/theming/getThemeColors.js", () => ({
    getThemeColors: () => ({ primary: "#000", surface: "#fff" }),
}));
vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(async () => {}),
}));

describe("createMarkerCountSelector", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        delete (window as any).mapMarkerCount;
    });

    it("initializes with default and invokes onChange on select change", async () => {
        const { createMarkerCountSelector } =
            await import("../../../../utils/ui/controls/createMarkerCountSelector.js");
        const onChange = vi.fn();
        const el = createMarkerCountSelector(onChange);
        expect(el.querySelector("select")).toBeTruthy();

        const select = el.querySelector("select")! as HTMLSelectElement;
        expect(select.value).toBe("50");
        select.value = "all";
        select.dispatchEvent(new Event("change"));
        expect((window as any).mapMarkerCount).toBe(0);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it("supports wheel to change selection up/down", async () => {
        const { createMarkerCountSelector } =
            await import("../../../../utils/ui/controls/createMarkerCountSelector.js");
        const el = createMarkerCountSelector();
        const select = el.querySelector("select")! as HTMLSelectElement;
        // Wheel down -> next option
        select.dispatchEvent(
            new WheelEvent("wheel", {
                deltaY: 1,
                bubbles: true,
                cancelable: true,
            })
        );
        // Value should change from default 50 to next (100)
        expect(select.value).toBe("100");
        // Wheel up -> previous option
        select.dispatchEvent(
            new WheelEvent("wheel", {
                deltaY: -1,
                bubbles: true,
                cancelable: true,
            })
        );
        expect(select.value).toBe("50");
    });
});
