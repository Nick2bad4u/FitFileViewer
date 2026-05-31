import { describe, it, expect, vi, beforeEach } from "vitest";

type MarkerCountWindow = Window & {
    mapMarkerCount?: number;
};

vi.mock(
    import("../../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: () => ({ primary: "#000", surface: "#fff" }),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi.fn<
            (message: string, type?: string) => Promise<void>
        >(async () => {}),
    })
);

describe("createMarkerCountSelector", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        delete (window as MarkerCountWindow).mapMarkerCount;
    });

    it("initializes with default and invokes onChange on select change", async () => {
        expect.hasAssertions();

        const { createMarkerCountSelector } =
            await import("../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js");
        const onChange = vi.fn<(count: number) => void>();
        const el = createMarkerCountSelector(onChange);

        const select = el.querySelector("select")! as HTMLSelectElement;
        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect(select.value).toBe("50");
        select.value = "all";
        select.dispatchEvent(new Event("change"));
        expect((window as MarkerCountWindow).mapMarkerCount).toBe(0);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it("falls back to the default for invalid marker count values", async () => {
        expect.hasAssertions();

        const markerWindow = window as MarkerCountWindow;
        markerWindow.mapMarkerCount = 999;

        const { createMarkerCountSelector } =
            await import("../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js");
        const el = createMarkerCountSelector();
        const select = el.querySelector("select")! as HTMLSelectElement;

        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect(select.value).toBe("50");
        expect(select.value).not.toBe("999");
        expect(markerWindow.mapMarkerCount).toBe(50);
    });

    it("supports wheel to change selection up/down", async () => {
        expect.hasAssertions();

        const { createMarkerCountSelector } =
            await import("../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js");
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
