/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the state manager module first
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
}));

// Then import the modules
import { updateActiveTab, initializeActiveTabState, getActiveTab } from "../../../utils/ui/tabs/updateActiveTab.js";
import { getState, setState, subscribe } from "../../../utils/state/core/stateManager.js";

// Get the mocked functions
const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

describe("updateActiveTab.js - Basic Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
        mockGetState.mockReturnValue("summary");
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it("should export all required functions", () => {
        expect(typeof updateActiveTab).toBe("function");
        expect(typeof initializeActiveTabState).toBe("function");
        expect(typeof getActiveTab).toBe("function");
    });

    it("should call setState when updateActiveTab is called", () => {
        // Create a tab element in the DOM
        const button = document.createElement("button");
        button.id = "tab-summary";
        button.className = "tab-button";
        document.body.appendChild(button);

        updateActiveTab("tab-summary");
        expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", { source: "updateActiveTab" });
    });

    it("should call getState when getActiveTab is called", () => {
        mockGetState.mockReturnValue("chart");
        const result = getActiveTab();
        expect(result).toBe("chartjs");
        expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
    });
});
