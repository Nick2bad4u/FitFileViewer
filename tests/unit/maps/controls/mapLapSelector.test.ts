import { describe, expect, it, vi } from "vitest";

import { addLapSelector } from "../../../../electron-app/utils/maps/controls/mapLapSelector.js";
import { setGlobalData } from "../../../../electron-app/utils/state/core/globalDataStore.js";
import { __resetStateManagerForTests } from "../../../../electron-app/utils/state/core/stateManager.js";

type LapSelection = "all" | string[];
type DrawLaps = (selection: LapSelection) => void;

function createContainer(): HTMLElement {
    const container = document.createElement("div");
    document.body.append(container);
    return container;
}

function removeContainer(container: HTMLElement): void {
    container.remove();
    __resetStateManagerForTests();
}

function getRequiredSelect(container: HTMLElement): HTMLSelectElement {
    const select = container.querySelector("#lap-select");
    expect(select).toBeInstanceOf(HTMLSelectElement);
    return select as HTMLSelectElement;
}

function getRequiredButton(
    container: HTMLElement,
    selector: string
): HTMLButtonElement {
    const button = container.querySelector(selector);
    expect(button).toBeInstanceOf(HTMLButtonElement);
    return button as HTMLButtonElement;
}

function getSelectorState(select: HTMLSelectElement) {
    return {
        multiple: select.multiple,
        multipleAttribute: select.getAttribute("multiple"),
        optionLabels: [...select.options].map((option) => option.textContent),
        optionValues: [...select.options].map((option) => option.value),
        selectedValues: [...select.selectedOptions].map(
            (option) => option.value
        ),
        size: select.size,
    };
}

describe("mapLapSelector", () => {
    it("does not render a lap selector when lap data is missing", () => {
        expect.assertions(1);

        const container = createContainer();

        addLapSelector({}, container, vi.fn<DrawLaps>());

        expect({
            childElementCount: container.childElementCount,
            lapSelectIds: [...container.querySelectorAll("#lap-select")].map(
                (element) => element.id
            ),
        }).toStrictEqual({
            childElementCount: 0,
            lapSelectIds: [],
        });

        removeContainer(container);
    });

    it("renders a selector option for each lap plus the all option", () => {
        expect.assertions(5);

        setGlobalData(
            {
                lapMesgs: [
                    {},
                    {},
                    {},
                ],
            },
            { source: "test" }
        );
        const container = createContainer();

        addLapSelector({}, container, vi.fn<DrawLaps>());

        const select = getRequiredSelect(container);

        expect(
            container.querySelectorAll(".custom-lap-control-container")
        ).toHaveLength(1);
        expect(getSelectorState(select)).toStrictEqual({
            multiple: false,
            multipleAttribute: null,
            optionLabels: [
                "All",
                "Lap 1",
                "Lap 2",
                "Lap 3",
            ],
            optionValues: [
                "all",
                "0",
                "1",
                "2",
            ],
            selectedValues: ["all"],
            size: 1,
        });
        expect(getSelectorState(select).optionLabels).not.toContain("Lap 4");
        expect(container.querySelectorAll("#deselect-all-btn")).toHaveLength(1);

        removeContainer(container);
    });

    it("calls mapDrawLaps with selected single and multi-lap values", () => {
        expect.assertions(11);

        setGlobalData(
            {
                lapMesgs: [
                    {},
                    {},
                    {},
                ],
            },
            { source: "test" }
        );
        const container = createContainer();
        const mapDrawLaps = vi.fn<DrawLaps>();

        addLapSelector({}, container, mapDrawLaps);

        const select = getRequiredSelect(container);
        const toggle = getRequiredButton(container, "#multi-lap-toggle");
        const deselectAll = getRequiredButton(container, "#deselect-all-btn");

        expect(getSelectorState(select)).toStrictEqual({
            multiple: false,
            multipleAttribute: null,
            optionLabels: [
                "All",
                "Lap 1",
                "Lap 2",
                "Lap 3",
            ],
            optionValues: [
                "all",
                "0",
                "1",
                "2",
            ],
            selectedValues: ["all"],
            size: 1,
        });

        select.value = "1";
        select.dispatchEvent(new Event("change"));

        expect(mapDrawLaps).toHaveBeenCalledWith(["1"]);

        toggle.click();
        select.options[1]!.selected = true;
        select.options[2]!.selected = true;
        select.dispatchEvent(new Event("change"));

        expect(getSelectorState(select)).toStrictEqual({
            multiple: true,
            multipleAttribute: "",
            optionLabels: [
                "All",
                "Lap 1",
                "Lap 2",
                "Lap 3",
            ],
            optionValues: [
                "all",
                "0",
                "1",
                "2",
            ],
            selectedValues: ["0", "1"],
            size: 4,
        });
        expect({
            deselectDisplay: deselectAll.style.display,
            toggleActive: [...toggle.classList],
            toggleTitle: toggle.title,
        }).toStrictEqual({
            deselectDisplay: "",
            toggleActive: ["multi-lap-toggle", "active"],
            toggleTitle: "Return to single-lap mode",
        });
        expect(mapDrawLaps).toHaveBeenCalledWith(["0", "1"]);
        expect(mapDrawLaps).not.toHaveBeenCalledWith(["3"]);

        select.dispatchEvent(
            new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
        );

        expect(getSelectorState(select).selectedValues).toStrictEqual(["all"]);
        expect(mapDrawLaps).toHaveBeenCalledWith("all");

        removeContainer(container);
    });
});
