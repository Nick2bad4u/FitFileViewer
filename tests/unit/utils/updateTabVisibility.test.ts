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
type ContentSectionState = {
    ariaHidden: null | string;
    classes: string[];
    display: string;
    id: string;
};

const EXPECTED_INVALIDATE_SIZE_OPTIONS = {
    animate: false,
    pan: false,
} as const;

const stateManagerMocks = vi.hoisted(() => ({
    getState: vi.fn<StateGetter>(),
    setState: vi.fn<StateSetter>(),
    subscribe: vi.fn<StateSubscriber>(() => () => {}),
}));

vi.mock(
    "../../../electron-app/utils/state/domain/rendererStateManagerAccess.js",
    () => ({
        getRendererCoreStateManager: vi.fn(() => stateManagerMocks),
        getRequiredRendererCoreStateManager: vi.fn(() => stateManagerMocks),
        toRendererStateManagerAccess: vi.fn((candidate: unknown) =>
            candidate &&
            typeof candidate === "object" &&
            "getState" in candidate &&
            "setState" in candidate &&
            "subscribe" in candidate
                ? candidate
                : undefined
        ),
    })
);

import {
    getRegisteredLeafletMapInstance,
    resetRegisteredLeafletMapInstanceForTests,
    setRegisteredLeafletMapInstance,
} from "../../../electron-app/utils/maps/state/mapLeafletInstanceState.js";
import {
    resetRegisteredMapPluginControlsForTests,
    setRegisteredMapMiniMapControl,
} from "../../../electron-app/utils/maps/state/mapPluginControlState.js";
import {
    cleanupTabVisibilityState,
    getVisibleTabContent,
    hideAllTabContent,
    initializeTabVisibilityState,
    showTabContent,
    updateTabVisibility,
} from "../../../electron-app/utils/ui/tabs/updateTabVisibility.js";

const contentIds = [
    "content_data",
    "content_chartjs",
    "content_browser",
    "content_map",
    "content_summary",
    "content_altfit",
    "content_zwift",
] as const;

const mockGetState = stateManagerMocks.getState;
const mockSetState = stateManagerMocks.setState;
const mockSubscribe = stateManagerMocks.subscribe;

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

function getContentSectionState(
    id: (typeof contentIds)[number]
): ContentSectionState {
    const element = getContentElement(id);

    return {
        ariaHidden: element.getAttribute("aria-hidden"),
        classes: [...element.classList],
        display: element.style.display,
        id: element.id,
    };
}

function getAllContentSectionStates(): ContentSectionState[] {
    return contentIds.map((id) => getContentSectionState(id));
}

function getHiddenContentState(
    id: (typeof contentIds)[number]
): ContentSectionState {
    return {
        ariaHidden: "true",
        classes: [],
        display: "none",
        id,
    };
}

function getInitialHiddenContentState(
    id: (typeof contentIds)[number]
): ContentSectionState {
    return {
        ariaHidden: null,
        classes: [],
        display: "none",
        id,
    };
}

function getVisibleContentState(
    id: (typeof contentIds)[number]
): ContentSectionState {
    return {
        ariaHidden: "false",
        classes: ["active"],
        display: "flex",
        id,
    };
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
        resetRegisteredLeafletMapInstanceForTests();
        resetRegisteredMapPluginControlsForTests();
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        mockGetState.mockReturnValue("summary");
    });

    afterEach(() => {
        cleanupTabVisibilityState();
        resetRegisteredLeafletMapInstanceForTests();
        resetRegisteredMapPluginControlsForTests();
        warnSpy.mockRestore();
        document.body.replaceChildren();
        vi.useRealTimers();
    });

    it("hides every tracked content section when no target is provided", () => {
        expect.assertions(2);

        updateTabVisibility(null);

        expect(getAllContentSectionStates()).toStrictEqual(
            contentIds.map((id) => getHiddenContentState(id))
        );
        expect(mockSetState).not.toHaveBeenCalled();
    });

    it("shows only the requested content section and stores the active content name", () => {
        expect.assertions(2);

        updateTabVisibility("content_summary");

        expect({
            map: getContentSectionState("content_map"),
            summary: getContentSectionState("content_summary"),
        }).toStrictEqual({
            map: getHiddenContentState("content_map"),
            summary: getVisibleContentState("content_summary"),
        });
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "summary",
            { source: "updateTabVisibility" }
        );
    });

    it("maps chart tab names to the chartjs content element", () => {
        expect.assertions(2);

        showTabContent("chart");

        expect(getContentElement("content_chartjs").style.display).toBe("flex");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "chart",
            { source: "updateTabVisibility" }
        );
    });

    it("accepts alternate content id shapes when a canonical element exists", () => {
        expect.assertions(2);

        updateTabVisibility("summary_content");

        expect(getContentElement("content_summary").style.display).toBe("flex");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "summary",
            { source: "updateTabVisibility" }
        );
    });

    it("warns for missing tracked content sections while updating existing sections", () => {
        expect.assertions(2);

        getContentElement("content_summary").remove();

        updateTabVisibility("content_map");

        expect(warnSpy).toHaveBeenCalledWith(
            "updateTabVisibility: Missing element in the DOM: content_summary. Please check the HTML structure to ensure the element with ID 'content_summary' exists, or verify that it is dynamically added to the DOM before calling updateTabVisibility."
        );
        expect(getContentElement("content_map").style.display).toBe("flex");
    });

    it("keeps all tracked sections hidden for unknown content ids without storing derived content names", () => {
        expect.assertions(2);

        updateTabVisibility("content_missing");

        expect(getAllContentSectionStates()).toStrictEqual(
            contentIds.map((id) => getHiddenContentState(id))
        );
        expect(mockSetState).not.toHaveBeenCalled();
    });

    it("reads visible content from typed active-tab-content state", () => {
        expect.assertions(3);

        mockGetState.mockReturnValue("map");

        expect(getVisibleTabContent()).toBe("map");
        expect(mockGetState).toHaveBeenCalledWith("ui.activeTabContent");

        mockGetState.mockReturnValue("");
        expect(getVisibleTabContent()).toBe("summary");
    });

    it("registers active-tab and raw FIT data subscriptions", () => {
        expect.assertions(4);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        initializeTabVisibilityState();

        const subscriptionRegistrations = mockSubscribe.mock.calls.map(
            ([path, callback]) => [path, typeof callback]
        );
        expect(subscriptionRegistrations).toStrictEqual([
            ["ui.activeTab", "function"],
            ["fitFile.rawData", "function"],
        ]);
        expect(logSpy).toHaveBeenCalledWith(
            "[TabVisibility] State management initialized"
        );
        expect(getSubscription("ui.activeTab")).toBeTypeOf("function");
        expect(getSubscription("fitFile.rawData")).toBeTypeOf("function");

        logSpy.mockRestore();
    });

    it("cleans prior subscriptions and pending no-data timers before reinitializing", () => {
        expect.assertions(5);

        vi.useFakeTimers();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const unsubscribes: Array<ReturnType<typeof vi.fn<() => void>>> = [];
        mockSubscribe.mockImplementation(() => {
            const unsubscribe = vi.fn<() => void>();
            unsubscribes.push(unsubscribe);
            return unsubscribe;
        });

        initializeTabVisibilityState();
        getSubscription("fitFile.rawData")(null);

        initializeTabVisibilityState();
        vi.advanceTimersByTime(260);

        expect(mockSubscribe).toHaveBeenCalledTimes(4);
        expect(unsubscribes).toHaveLength(4);
        expect(unsubscribes[0]).toHaveBeenCalledOnce();
        expect(unsubscribes[1]).toHaveBeenCalledOnce();
        expect(mockSetState).not.toHaveBeenCalledWith(
            "ui.activeTab",
            "summary",
            { source: "initializeTabVisibilityState" }
        );

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
            { source: "updateTabVisibility" }
        );
    });

    it("normalizes non-string active-tab subscription values to summary content", () => {
        expect.assertions(2);

        initializeTabVisibilityState();

        getSubscription("ui.activeTab")(null);

        expect(getContentElement("content_summary").style.display).toBe("flex");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "summary",
            { source: "updateTabVisibility" }
        );
    });

    it("normalizes unknown active-tab subscription values to summary content", () => {
        expect.assertions(2);

        initializeTabVisibilityState();

        getSubscription("ui.activeTab")("unknown");

        expect(getContentElement("content_summary").style.display).toBe("flex");
        expect(mockSetState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "summary",
            { source: "updateTabVisibility" }
        );
    });

    it("hides all content through the helper", () => {
        expect.assertions(1);

        updateTabVisibility("content_summary");
        hideAllTabContent();

        expect(getAllContentSectionStates()).toStrictEqual(
            contentIds.map((id) => getHiddenContentState(id))
        );
    });

    it("refreshes Leaflet map layout when showing the map tab", () => {
        expect.assertions(3);

        vi.useFakeTimers();
        const mapInstance = {
            invalidateSize: vi.fn<InvalidateSize>(),
        };
        const miniMapInvalidateSize = vi.fn<InvalidateSize>();
        setRegisteredLeafletMapInstance(mapInstance);
        setRegisteredMapMiniMapControl({
            _miniMap: { invalidateSize: miniMapInvalidateSize },
        });

        updateTabVisibility("content_map");
        vi.runAllTimers();

        expect(getContentSectionState("content_map")).toStrictEqual(
            getVisibleContentState("content_map")
        );
        expect(
            getRegisteredLeafletMapInstance<{
                invalidateSize: ReturnType<typeof vi.fn<InvalidateSize>>;
            }>()?.invalidateSize
        ).toHaveBeenCalledWith(EXPECTED_INVALIDATE_SIZE_OPTIONS);
        expect(miniMapInvalidateSize).toHaveBeenCalledWith();
    });
});
