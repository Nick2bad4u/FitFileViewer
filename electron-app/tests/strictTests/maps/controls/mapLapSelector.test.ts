import { describe, it, expect, beforeEach, vi } from "vitest";

async function loadModule() {
    return await import("../../../../utils/maps/controls/mapLapSelector.js");
}

describe("mapLapSelector", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
        (window as any).globalData = {
            lapMesgs: [
                {},
                {},
                {},
            ],
        };
    });

    it("adds control and handles single vs multi select changes", async () => {
        const { addLapSelector } = await loadModule();
        const container = document.getElementById("container")!;
        const draws: any[] = [];
        const drawFn = vi.fn((sel: any) => draws.push(sel));

        addLapSelector(null as any, container, drawFn);
        const select = container.querySelector(
            "#lap-select"
        ) as HTMLSelectElement;
        const toggle = container.querySelector(
            "#multi-lap-toggle"
        ) as HTMLButtonElement;
        expect(select).toBeTruthy();

        // Single-select: choose Lap 2
        // Explicitly control option selections to avoid jsdom quirks
        for (const opt of Array.from(select.options)) opt.selected = false;
        select.options[2].selected = true; // Lap 2
        select.dispatchEvent(new Event("change"));
        const last = draws.at(-1);
        expect(Array.isArray(last)).toBe(true);
        expect(last).toHaveLength(1);
        expect(last[0]).toBe("1");

        // Enable multi-select
        toggle.click();
        // Select All and another -> should normalize to All only
        for (const opt of Array.from(select.options)) opt.selected = false;
        select.options[0].selected = true; // All
        select.options[2].selected = true; // Lap 2
        select.dispatchEvent(new Event("change"));
        expect(drawFn).toHaveBeenLastCalledWith("all");

        // Deselect All, pick two laps -> array
        for (const opt of Array.from(select.options)) opt.selected = false;
        select.options[1].selected = true; // Lap 1
        select.options[3].selected = true; // Lap 3
        select.dispatchEvent(new Event("change"));
        expect(Array.isArray(draws.at(-1))).toBe(true);
    });
});
