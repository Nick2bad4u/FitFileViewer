// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StateGetter = (path: string) => unknown;
type StateSetter = (path: string, value: unknown, metadata?: unknown) => void;
type StateSubscriber = (
    path: string,
    callback: (value: unknown) => void
) => () => void;
type InvalidateSizeOptions = {
    animate: boolean;
    pan: boolean;
};
type InvalidateSize = (options?: InvalidateSizeOptions) => void;

const EXPECTED_INVALIDATE_SIZE_OPTIONS = {
    animate: false,
    pan: false,
} as const;

// The dynamic import mock form is unstable for this mixed JS/TS module graph.
// eslint-disable-next-line vitest/prefer-import-in-mock
vi.mock("../../../electron-app/utils/state/core/stateManager.js", () => ({
    getState: vi.fn<StateGetter>(),
    setState: vi.fn<StateSetter>(),
    subscribe: vi.fn<StateSubscriber>(() => () => {}),
}));

import {
    getState,
    setState,
    subscribe,
} from "../../../electron-app/utils/state/core/stateManager.js";
import {
    getVisibleTabContent,
    hideAllTabContent,
    initializeTabVisibilityState,
    showTabContent,
    updateTabVisibility,
} from "../../../electron-app/utils/ui/tabs/updateTabVisibility.js";

type GlobalWithMap = typeof globalThis & {
    _leafletMapInstance?: {
        invalidateSize: ReturnType<typeof vi.fn<InvalidateSize>>;
    } | null;
    _miniMapControl?: {
        _miniMap?: {
            invalidateSize: ReturnType<typeof vi.fn<InvalidateSize>>;
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

describe(updateTabVisibility, () => {
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
        expect.assertions(22);

        updateTabVisibility(null);

        for (const id of contentIds) {
            const element = getContentElement(id);
            expect(element.getAttribute("aria-hidden")).toBe("true");
            expect(element.style.display).toBe("none");
            expect([...element.classList]).toStrictEqual([]);
        }
        expect(mockSetState).not.toHaveBeenCalled();
    });

    it("shows only the requested content section and stores the active content name", () => {
        expect.assertions(4);

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
        expect.assertions(2);

        showTabContent("chart");

        expect(getContentElement("content_chartjs").style.display).toBe("flex");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "chart",
            expect.objectContaining({ source: "updateTabVisibility" })
        );
    });

    it("accepts alternate content id shapes when a canonical element exists", () => {
        expect.assertions(2);

        updateTabVisibility("summary_content");

        expect(getContentElement("content_summary").style.display).toBe("flex");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "summary",
            expect.objectContaining({ source: "updateTabVisibility" })
        );
    });

    it("warns for missing tracked content sections while updating existing sections", () => {
        expect.assertions(2);

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
        expect.assertions(8);

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
        expect.assertions(3);

        mockGetState.mockReturnValue("map");

        expect(getVisibleTabContent()).toBe("map");
        expect(mockGetState).toHaveBeenCalledWith("ui.activeTabContent");

        mockGetState.mockReturnValue("");
        expect(getVisibleTabContent()).toBeNull();
    });

    it("registers active-tab and global-data subscriptions", () => {
        expect.assertions(5);

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
        expect.assertions(2);

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
        expect.assertions(8);

        initializeTabVisibilityState();

        getSubscription("ui.activeTab")(null);

        for (const id of contentIds) {
            expect(getContentElement(id).style.display).toBe("none");
        }
        expect(mockSetState).not.toHaveBeenCalled();
    });

    it("hides all content through the helper", () => {
        expect.assertions(7);

        updateTabVisibility("content_summary");
        hideAllTabContent();

        for (const id of contentIds) {
            expect(getContentElement(id).style.display).toBe("none");
        }
    });

    it("refreshes Leaflet map layout when showing the map tab", () => {
        expect.assertions(3);

        vi.useFakeTimers();
        const globals = globalThis as GlobalWithMap;
        globals._leafletMapInstance = {
            invalidateSize: vi.fn<InvalidateSize>(),
        };
        globals._miniMapControl = {
            _miniMap: { invalidateSize: vi.fn<InvalidateSize>() },
        };

        updateTabVisibility("content_map");
        vi.runAllTimers();

        expect(getContentElement("content_map").style.display).toBe("flex");
        expect(globals._leafletMapInstance.invalidateSize).toHaveBeenCalledWith(
            EXPECTED_INVALIDATE_SIZE_OPTIONS
        );
        expect(
            globals._miniMapControl._miniMap?.invalidateSize
        ).toHaveBeenCalledWith();
    });
});
