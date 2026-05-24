/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the state manager module first
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
}));

// Then import the modules
import {
    updateActiveTab,
    initializeActiveTabState,
    getActiveTab,
} from "../../../utils/ui/tabs/updateActiveTab.js";
import {
    getState,
    setState,
    subscribe,
} from "../../../utils/state/core/stateManager.js";

// Get the mocked functions
const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

describe("updateActiveTab.js - Basic Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
        mockGetState.mockReturnValue("summary");
        Object.assign(globalThis, {
            __vitest_effective_document__: document,
            __vitest_effective_stateManager__: {
                getState: mockGetState,
                setState: mockSetState,
                subscribe: mockSubscribe,
            },
        });
    });

    afterEach(() => {
        Object.assign(globalThis, {
            __vitest_effective_document__: undefined,
            __vitest_effective_stateManager__: undefined,
        });
        vi.resetAllMocks();
    });

    it("should export all required functions", () => {
        expect(typeof updateActiveTab).toBe("function");
        expect(typeof initializeActiveTabState).toBe("function");
        expect(typeof getActiveTab).toBe("function");
    });

    it("should call setState when updateActiveTab is called", () => {
        // Create a tab element in the DOM
        const previousButton = document.createElement("button");
        previousButton.id = "tab_chart";
        previousButton.className = "tab-button active";
        document.body.appendChild(previousButton);

        const button = document.createElement("button");
        button.id = "tab_summary";
        button.className = "tab-button";
        document.body.appendChild(button);

        const updated = updateActiveTab("tab_summary");

        expect(updated).toBe(true);
        expect(button.classList.contains("active")).toBe(true);
        expect(previousButton.classList.contains("active")).toBe(false);
        expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", {
            source: "updateActiveTab",
        });
    });

    it("should reject invalid tab IDs without updating state", () => {
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);

        const updated = updateActiveTab("");

        expect(updated).toBe(false);
        expect(mockSetState).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
            "[updateActiveTab] Invalid tabId:",
            ""
        );
    });

    it("should call getState when getActiveTab is called", () => {
        mockGetState.mockReturnValue("chart");
        const result = getActiveTab();
        expect(result).toBe("chart");
        expect(mockGetState).toHaveBeenCalledWith("ui.activeTab");
    });
});
