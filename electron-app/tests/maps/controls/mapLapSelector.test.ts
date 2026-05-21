import { describe, expect, it, vi } from "vitest";

import { addLapSelector } from "../../../utils/maps/controls/mapLapSelector.js";

type LapSelectorGlobal = typeof globalThis & {
    globalData?: { lapMesgs: unknown[] };
};

type LapSelection = "all" | string[];
type DrawLaps = (selection: LapSelection) => void;

function getTestGlobal(): LapSelectorGlobal {
    return globalThis as LapSelectorGlobal;
}

function createContainer(): HTMLElement {
    const container = document.createElement("div");
    document.body.append(container);
    return container;
}

function removeContainer(container: HTMLElement): void {
    container.remove();
    delete getTestGlobal().globalData;
}

describe("mapLapSelector", () => {
    it("does not render a lap selector when lap data is missing", () => {
        expect.assertions(2);

        const container = createContainer();

        addLapSelector({}, container, vi.fn<DrawLaps>());

        expect(container.childElementCount).toBe(0);
        expect(container.querySelectorAll("#lap-select")).toHaveLength(0);

        removeContainer(container);
    });

    it("renders a selector option for each lap plus the all option", () => {
        expect.assertions(5);

        getTestGlobal().globalData = {
            lapMesgs: [
                {},
                {},
                {},
            ],
        };
        const container = createContainer();

        addLapSelector({}, container, vi.fn<DrawLaps>());

        const select = container.querySelector<HTMLSelectElement>("#lap-select");
        const labels = [...(select?.options ?? [])].map(
            (option) => option.textContent
        );

        expect(container.querySelectorAll(".custom-lap-control-container")).toHaveLength(1);
        expect(select?.options).toHaveLength(4);
        expect(labels).toStrictEqual([
            "All",
            "Lap 1",
            "Lap 2",
            "Lap 3",
        ]);
        expect(labels).not.toContain("Lap 4");
        expect(container.querySelectorAll("#deselect-all-btn")).toHaveLength(1);

        removeContainer(container);
    });

    it("calls mapDrawLaps with selected single and multi-lap values", () => {
        expect.assertions(5);

        getTestGlobal().globalData = {
            lapMesgs: [
                {},
                {},
                {},
            ],
        };
        const container = createContainer();
        const mapDrawLaps = vi.fn<DrawLaps>();

        addLapSelector({}, container, mapDrawLaps);

        const select = container.querySelector<HTMLSelectElement>("#lap-select");
        const toggle = container.querySelector<HTMLButtonElement>("#multi-lap-toggle");

        expect(select?.getAttribute("multiple") ?? "missing").toBe("missing");

        select!.value = "1";
        select!.dispatchEvent(new Event("change"));

        expect(mapDrawLaps).toHaveBeenCalledWith(["1"]);

        toggle!.click();
        select!.options[1]!.selected = true;
        select!.options[2]!.selected = true;
        select!.dispatchEvent(new Event("change"));

        expect(select?.getAttribute("multiple") ?? "missing").toBe("");
        expect(mapDrawLaps).toHaveBeenCalledWith([
            "0",
            "1",
        ]);
        expect(mapDrawLaps).not.toHaveBeenCalledWith(["3"]);

        removeContainer(container);
    });
});
