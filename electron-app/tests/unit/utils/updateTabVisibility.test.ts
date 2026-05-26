/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
}));

import {
    getState,
    setState,
    subscribe,
} from "../../../utils/state/core/stateManager.js";
import {
    getVisibleTabContent,
    hideAllTabContent,
    initializeTabVisibilityState,
    showTabContent,
    updateTabVisibility,
} from "../../../utils/ui/tabs/updateTabVisibility.js";

type GlobalWithMap = typeof globalThis & {
    _leafletMapInstance?: {
        invalidateSize: ReturnType<typeof vi.fn>;
    } | null;
    _miniMapControl?: {
        _miniMap?: {
            invalidateSize: ReturnType<typeof vi.fn>;
        } | null;
    } | null;
};

const contentIds = [
    "content_data",
    "content_chartjs",
    "content_browser",
    "content_map",
    "content_summary",
    "content_altfit",
    "content_zwift",
] as const;

const mockGetState = vi.mocked(getState);
const mockSetState = vi.mocked(setState);
const mockSubscribe = vi.mocked(subscribe);

function appendContentSections(): void {
    document.body.replaceChildren(
        ...contentIds.map((id) => {
            const element = document.createElement("section");
            element.id = id;
            element.style.display = "none";

            return element;
        })
    );
}

function getContentElement(id: (typeof contentIds)[number]): HTMLElement {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLElement)) {
        throw new Error(`Expected ${id} to exist`);
    }

    return element;
}

function getSubscription(path: string): (value: unknown) => void {
    const callback = mockSubscribe.mock.calls.find(
        ([subscriptionPath]) => subscriptionPath === path
    )?.[1];

    if (typeof callback !== "function") {
        throw new Error(`Expected ${path} subscription to be registered`);
    }

    return callback;
}

describe("updateTabVisibility", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        appendContentSections();
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        mockGetState.mockReturnValue("summary");
    });

    afterEach(() => {
        const globals = globalThis as GlobalWithMap;
        delete globals._leafletMapInstance;
        delete globals._miniMapControl;
        warnSpy.mockRestore();
        document.body.replaceChildren();
        vi.useRealTimers();
    });

    it("hides every tracked content section when no target is provided", () => {
        updateTabVisibility(null);

        for (const id of contentIds) {
            const element = getContentElement(id);
            expect(element.style.display).toBe("none");
            expect(element.getAttribute("aria-hidden")).toBe("true");
            expect(element.classList.contains("active")).toBe(false);
        }
        expect(mockSetState).not.toHaveBeenCalled();
    });

    it("shows only the requested content section and stores the active content name", () => {
        updateTabVisibility("content_summary");

        expect(getContentElement("content_summary").style.display).toBe("flex");
        expect(
            getContentElement("content_summary").getAttribute("aria-hidden")
        ).toBe("false");
        expect(getContentElement("content_map").style.display).toBe("none");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "summary",
            expect.objectContaining({ source: "updateTabVisibility" })
        );
    });

    it("maps chart tab names to the chartjs content element", () => {
        showTabContent("chart");

        expect(getContentElement("content_chartjs").style.display).toBe("flex");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "chart",
            expect.objectContaining({ source: "updateTabVisibility" })
        );
    });

    it("accepts alternate content id shapes when a canonical element exists", () => {
        updateTabVisibility("summary_content");

        expect(getContentElement("content_summary").style.display).toBe("flex");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "summary",
            expect.objectContaining({ source: "updateTabVisibility" })
        );
    });

    it("warns for missing tracked content sections while updating existing sections", () => {
        getContentElement("content_summary").remove();

        updateTabVisibility("content_map");

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                "updateTabVisibility: Missing element in the DOM: content_summary"
            )
        );
        expect(getContentElement("content_map").style.display).toBe("flex");
    });

    it("keeps all tracked sections hidden for unknown content ids but stores derived content names", () => {
        updateTabVisibility("content_missing");

        for (const id of contentIds) {
            expect(getContentElement(id).style.display).toBe("none");
        }
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "missing",
            expect.objectContaining({ source: "updateTabVisibility" })
        );
    });

    it("reads visible content from state", () => {
        mockGetState.mockReturnValue("map");

        expect(getVisibleTabContent()).toBe("map");
        expect(mockGetState).toHaveBeenCalledWith("ui.activeTabContent");

        mockGetState.mockReturnValue("");
        expect(getVisibleTabContent()).toBeNull();
    });

    it("registers active-tab and global-data subscriptions", () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        initializeTabVisibilityState();

        expect(mockSubscribe).toHaveBeenCalledWith(
            "ui.activeTab",
            expect.any(Function)
        );
        expect(mockSubscribe).toHaveBeenCalledWith(
            "globalData",
            expect.any(Function)
        );
        expect(logSpy).toHaveBeenCalledWith(
            "[TabVisibility] State management initialized"
        );
        expect(getSubscription("ui.activeTab")).toBeTypeOf("function");
        expect(getSubscription("globalData")).toBeTypeOf("function");

        logSpy.mockRestore();
    });

    it("shows content when the active-tab subscription receives a string tab name", () => {
        initializeTabVisibilityState();

        getSubscription("ui.activeTab")("map");

        expect(getContentElement("content_map").style.display).toBe("flex");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "map",
            expect.objectContaining({ source: "updateTabVisibility" })
        );
    });

    it("does not show content when the active-tab subscription receives a non-string value", () => {
        initializeTabVisibilityState();

        getSubscription("ui.activeTab")(null);

        for (const id of contentIds) {
            expect(getContentElement(id).style.display).toBe("none");
        }
        expect(mockSetState).not.toHaveBeenCalled();
    });

    it("hides all content through the helper", () => {
        updateTabVisibility("content_summary");
        hideAllTabContent();

        for (const id of contentIds) {
            expect(getContentElement(id).style.display).toBe("none");
        }
    });

    it("refreshes Leaflet map layout when showing the map tab", () => {
        vi.useFakeTimers();
        const globals = globalThis as GlobalWithMap;
        globals._leafletMapInstance = { invalidateSize: vi.fn() };
        globals._miniMapControl = {
            _miniMap: { invalidateSize: vi.fn() },
        };

        updateTabVisibility("content_map");
        vi.runAllTimers();

        expect(getContentElement("content_map").style.display).toBe("flex");
        expect(globals._leafletMapInstance.invalidateSize).toHaveBeenCalled();
        expect(
            globals._miniMapControl._miniMap?.invalidateSize
        ).toHaveBeenCalled();
    });
});
