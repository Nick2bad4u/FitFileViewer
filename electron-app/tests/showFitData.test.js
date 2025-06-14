import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { showFitData } from "../utils/showFitData";

describe("showFitData", () => {
    let fileSpan, unloadBtn, fileNameContainer;
    beforeEach(() => {
        fileSpan = document.createElement("span");
        fileSpan.id = "activeFileName";
        unloadBtn = document.createElement("button");
        unloadBtn.id = "unloadFileBtn";
        fileNameContainer = document.createElement("div");
        fileNameContainer.id = "activeFileNameContainer";
        document.body.appendChild(fileSpan);
        document.body.appendChild(unloadBtn);
        document.body.appendChild(fileNameContainer);
        window.electronAPI = { send: vi.fn() };
        window.displayTables = vi.fn();
        window.renderChart = vi.fn();
        window.renderMap = vi.fn();
        window.renderSummary = vi.fn();
    });
    afterEach(() => {
        document.body.innerHTML = "";
        delete window.electronAPI;
        delete window.displayTables;
        delete window.renderChart;
        delete window.renderMap;
        delete window.renderSummary;
        delete window.globalData;
    });
    it("should update file name and call electronAPI.send", () => {
        showFitData({ some: "data" }, "C:/path/to/file.fit");
        expect(fileSpan.textContent).toContain("file.fit");
        expect(unloadBtn.style.display).toBe("");
        expect(fileNameContainer.classList.contains("has-file")).toBe(true);
        expect(document.title).toContain("file.fit");
        expect(window.electronAPI.send).toHaveBeenCalledWith("fit-file-loaded", "C:/path/to/file.fit");
    });
    it("should call displayTables, renderChart, renderMap, renderSummary", () => {
        showFitData({ some: "data" }, "file.fit");
        expect(window.displayTables).toHaveBeenCalled();
        expect(window.renderChart).toHaveBeenCalled();
        expect(window.renderMap).toHaveBeenCalled();
        expect(window.renderSummary).toHaveBeenCalled();
    });
    it("should not throw if elements are missing", () => {
        document.body.innerHTML = "";
        expect(() => showFitData({ some: "data" }, "file.fit")).not.toThrow();
    });
});
