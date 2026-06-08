import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActiveFitRawData } from "../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import { __resetStateManagerForTests } from "../../../../../electron-app/utils/state/core/stateManager.js";

type LapSelection = "all" | string[];
type DrawLapsFn = (selection: LapSelection) => void;

async function loadModule() {
    return await import("../../../../../electron-app/utils/maps/controls/mapLapSelector.js");
}

describe("mapLapSelector", () => {
    beforeEach(() => {
        __resetStateManagerForTests();
        const container = document.createElement("div");
        container.id = "container";
        document.body.replaceChildren(container);
        setActiveFitRawData(
            {
                lapMesgs: [
                    {},
                    {},
                    {},
                ],
            },
            { source: "test" }
        );
    });

    it("adds control and handles single vs multi select changes", async () => {
        expect.assertions(7);

        const { addLapSelector } = await loadModule();
        const container = document.getElementById("container")!;
        const draws: LapSelection[] = [];
        const drawFn = vi.fn<DrawLapsFn>((selection) => {
            draws.push(selection);
        });

        addLapSelector(null as any, container, drawFn);
        const select = container.querySelector(
            "#lap-select"
        ) as HTMLSelectElement;
        const toggle = container.querySelector(
            "#multi-lap-toggle"
        ) as HTMLButtonElement;
        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect(toggle).toBeInstanceOf(HTMLButtonElement);

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

    it("does not add control when lap data is missing", async () => {
        expect.assertions(2);

        const { addLapSelector } = await loadModule();
        const container = document.getElementById("container")!;
        const drawFn = vi.fn<DrawLapsFn>();

        setActiveFitRawData(null, { source: "test.clear" });

        addLapSelector(null as any, container, drawFn);

        expect(
            container.querySelector(".custom-lap-control-container")
        ).not.toBeInstanceOf(HTMLElement);
        expect(drawFn).not.toHaveBeenCalled();
    });
});
