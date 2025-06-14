import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setupWindowOnload } from "../utils/setupWindow";

describe("setupWindowOnload", () => {
    let toggleTabVisibility, setActiveTab, setupTabButton, displayTables, renderChart, renderMap, renderSummary;
    beforeEach(() => {
        toggleTabVisibility = vi.fn();
        setActiveTab = vi.fn();
        setupTabButton = vi.fn();
        displayTables = vi.fn();
        renderChart = vi.fn();
        renderMap = vi.fn();
        renderSummary = vi.fn();
        window.globalData = { foo: "bar" };
        document.body.innerHTML = "";
    });
    afterEach(() => {
        delete window.globalData;
    });
    it("should call setupTabButton for each tab", () => {
        setupWindowOnload({ toggleTabVisibility, setActiveTab, setupTabButton, displayTables, renderChart, renderMap, renderSummary });
        window.onload();
        expect(setupTabButton).toHaveBeenCalledTimes(5);
    });
    it("should call toggleTabVisibility with content-map on load", () => {
        setupWindowOnload({ toggleTabVisibility, setActiveTab, setupTabButton, displayTables, renderChart, renderMap, renderSummary });
        window.onload();
        expect(toggleTabVisibility).toHaveBeenCalledWith("content-map");
    });
    it("should handle message event for fitData", () => {
        setupWindowOnload({ toggleTabVisibility, setActiveTab, setupTabButton, displayTables, renderChart, renderMap, renderSummary });
        window.onload();
        const event = new MessageEvent("message", { data: { type: "fitData", data: { foo: "bar" } } });
        window.dispatchEvent(event);
        expect(displayTables).toHaveBeenCalledWith({ foo: "bar" });
    });
});
