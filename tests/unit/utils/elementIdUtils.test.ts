import { describe, expect, it, vi } from "vitest";
import {
    buildIdVariants,
    getElementByIdFlexible,
    getElementByIdFlexibleList,
    querySelectorByIdFlexible,
} from "../../../electron-app/utils/ui/dom/elementIdUtils.js";

describe("elementIdUtils", () => {
    it("builds stable ID variants across separator and camel-case forms", () => {
        expect(buildIdVariants("open-file-btn")).toStrictEqual([
            "open-file-btn",
            "open_file_btn",
            "openFileBtn",
        ]);
        expect(buildIdVariants("openFileBtn")).toStrictEqual([
            "openFileBtn",
            "open_file_btn",
            "open-file-btn",
        ]);
    });

    it("resolves elements by alternate ID spellings", () => {
        document.body.innerHTML = `
            <button id="openFileBtn"></button>
            <section id="data-panel"></section>
        `;

        expect(getElementByIdFlexible(document, "open_file_btn")?.id).toBe(
            "openFileBtn"
        );
        expect(querySelectorByIdFlexible(document, "#data_panel")?.id).toBe(
            "data-panel"
        );
    });

    it("resolves a list of IDs inside a parent root", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span id="chartCanvas"></span>`;

        expect(
            getElementByIdFlexibleList(root, ["missing", "chart-canvas"])?.id
        ).toBe("chartCanvas");
    });

    it("accepts an explicit HTMLElement runtime", () => {
        document.body.innerHTML = `<button id="openFileBtn"></button>`;

        const isHTMLElement = vi.fn(
            (value: unknown): value is HTMLElement =>
                value instanceof HTMLElement
        );

        expect(
            getElementByIdFlexible(document, "open-file-btn", {
                isHTMLElement,
            })?.id
        ).toBe("openFileBtn");
        expect(isHTMLElement).toHaveBeenCalledWith(
            document.querySelector("#openFileBtn")
        );
    });
});
