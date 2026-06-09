import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getMapMarkerCount,
    resetMapMarkerCount,
    setMapMarkerCount,
} from "../../../../../electron-app/utils/maps/state/mapMarkerCountState.js";

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
        document.body.replaceChildren();
        resetMapMarkerCount();
    });

    function getRequiredSelect(container: HTMLElement): HTMLSelectElement {
        const select = container.querySelector("select");
        if (!(select instanceof HTMLSelectElement)) {
            throw new TypeError("Expected marker count select");
        }

        return select;
    }

    it("initializes with default and invokes onChange on select change", async () => {
        expect.assertions(4);

        const { createMarkerCountSelector } =
            await import("../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js");
        const onChange = vi.fn<(count: number) => void>();
        const el = createMarkerCountSelector(onChange);

        const select = getRequiredSelect(el);
        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect(select.value).toBe("50");
        select.value = "all";
        select.dispatchEvent(new Event("change"));
        expect(getMapMarkerCount()).toBe(0);
        expect(onChange).toHaveBeenCalledWith(0);
    });

    it("falls back to the default for invalid marker count values", async () => {
        expect.assertions(4);

        setMapMarkerCount(999);

        const { createMarkerCountSelector } =
            await import("../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js");
        const el = createMarkerCountSelector();
        const select = getRequiredSelect(el);

        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect(select.value).toBe("50");
        expect(select.value).not.toBe("999");
        expect(getMapMarkerCount()).toBe(50);
    });

    it("supports wheel to change selection up/down", async () => {
        expect.assertions(2);

        const { createMarkerCountSelector } =
            await import("../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js");
        const el = createMarkerCountSelector();
        const select = getRequiredSelect(el);
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
