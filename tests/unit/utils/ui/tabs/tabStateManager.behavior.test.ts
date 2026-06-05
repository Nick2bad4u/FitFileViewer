// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type MockFn = (...args: unknown[]) => unknown;
type VoidFn = (...args: unknown[]) => void;

// Create hoisted fns to be used inside vi.mock factory
const { mockGetState, mockSetState, mockSubscribe, mockUpdateState } =
    /* @type {any} */ vi.hoisted(() => ({
        mockGetState: vi.fn<MockFn>(),
        mockSetState: vi.fn<MockFn>(),
        mockSubscribe: vi.fn<MockFn>(),
        mockUpdateState: vi.fn<MockFn>(),
    }));

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager"),
    () => ({
        getState: mockGetState,
        setState: mockSetState,
        subscribe: mockSubscribe,
        updateState: mockUpdateState,
    })
);

// We won't mock showNotification path here to avoid path resolution mismatches.

// Import subject after mocks
import {
    tabStateManager,
    TAB_CONFIG,
} from "../../../../../electron-app/utils/ui/tabs/tabStateManager.js";

function getAltFitIframePathname(iframe: HTMLIFrameElement): string {
    const url = new URL(iframe.src);
    return url.pathname;
}

describe("tabStateManager.behavior", () => {
    /* @type {HTMLDivElement} */
    let root;
    /* @type {any} */
    let originalConsoleLog;
    /* @type {any} */
    let originalConsoleWarn;
    /* @type {any} */
    let originalConsoleError;

    beforeEach(() => {
        root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);

        // Default state
        mockGetState.mockReset();
        mockSetState.mockReset();
        mockSubscribe.mockReset();
        mockUpdateState.mockReset();

        mockGetState.mockImplementation((/* @type {any} */ key) => {
            switch (key) {
                case "ui.activeTab":
                    return "summary";
                case "globalData":
                    return { recordMesgs: [{ timestamp: 1 }] };
                case "charts":
                    return { isRendered: false };
                case "map":
                    return { isRendered: false };
                case "summary.lastDataHash":
                    return "";
                default:
                    return null;
            }
        });

        // Ensure tabStateManager uses our mocks via its global fallback
        // eslint-disable-next-line no-underscore-dangle
        /* @type {any} */ globalThis.__vitest_effective_stateManager__ = {
            getState: mockGetState,
            setState: mockSetState,
            subscribe: mockSubscribe,
            updateState: mockUpdateState,
        };

        // Quiet logs for deterministic tests
        originalConsoleLog = console.log;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;
        vi.spyOn(console, "log").mockImplementation();
        vi.spyOn(console, "warn").mockImplementation();
        vi.spyOn(console, "error").mockImplementation();

        // Provide globals used by handlers
        Object.assign(window, {
            renderSummary: vi.fn<MockFn>(),
            renderMap: vi.fn<MockFn>(),
            createTables: vi.fn<MockFn>(),
        });
    });

    afterEach(() => {
        root?.remove();
        console.log = /* @type {any} */ originalConsoleLog;
        console.warn = /* @type {any} */ originalConsoleWarn;
        console.error = /* @type {any} */ originalConsoleError;
        vi.resetAllMocks();
        // Cleanup global fallback
        // eslint-disable-next-line no-underscore-dangle
        // @ts-ignore
        delete (/* @type {any} */ globalThis.__vitest_effective_stateManager__);
    });

    it("extractTabName returns known ids and patterns, null for unknown", () => {
        expect.assertions(6);
        expect(tabStateManager.extractTabName("tab_data")).toBe("data");
        expect(tabStateManager.extractTabName("map_tab")).toBe("map");
        expect(tabStateManager.extractTabName("btn_summary")).toBe("summary");
        // also supports "-btn" suffix pattern
        expect(tabStateManager.extractTabName("summary_btn")).toBe("summary");
        // unknown
        expect(tabStateManager.extractTabName("tab_nonexistent")).toBeNull();
        expect(tabStateManager.extractTabName("invalid")).toBeNull();
    });

    it("handleTabButtonClick ignores disabled buttons and prevents event", () => {
        expect.assertions(4);
        const btn = document.createElement("button");
        btn.id = "tab_map";
        btn.className = "tab-button tab-disabled";
        root.appendChild(btn);

        const prevent = vi.fn<VoidFn>();
        const stop = vi.fn<VoidFn>();
        const evt = {
            currentTarget: btn,
            preventDefault: prevent,
            stopPropagation: stop,
        };

        tabStateManager.handleTabButtonClick(/* @type {any} */ evt);
        expect(prevent).toHaveBeenCalledWith();
        expect(stop).toHaveBeenCalledWith();
        expect(mockSetState).not.toHaveBeenCalled();
        expect(btn.classList.contains("tab-disabled")).toBe(true);
    });

    it("handleTabButtonClick ignores when disabled attribute present", () => {
        expect.assertions(4);
        const btn = document.createElement("button");
        btn.id = "tab_map";
        btn.className = "tab-button";
        btn.setAttribute("disabled", "");
        root.appendChild(btn);

        const prevent = vi.fn<VoidFn>();
        const stop = vi.fn<VoidFn>();
        tabStateManager.handleTabButtonClick(
            /* @type {any} */ {
                currentTarget: btn,
                preventDefault: prevent,
                stopPropagation: stop,
            }
        );

        expect(prevent).toHaveBeenCalledWith();
        expect(stop).toHaveBeenCalledWith();
        expect(mockSetState).not.toHaveBeenCalled();
        expect(btn).toHaveProperty("disabled", true);
    });

    it("handleTabButtonClick ignores when disabled property is true", () => {
        expect.assertions(2);
        const btn = document.createElement("button");
        btn.id = "tab_map";
        btn.className = "tab-button";
        // @ts-ignore
        btn.disabled = true;
        root.appendChild(btn);

        const prevent = vi.fn<VoidFn>();
        const stop = vi.fn<VoidFn>();
        tabStateManager.handleTabButtonClick(
            /* @type {any} */ {
                currentTarget: btn,
                preventDefault: prevent,
                stopPropagation: stop,
            }
        );

        expect(mockSetState).not.toHaveBeenCalled();
        expect(btn).toHaveProperty("disabled", true);
    });

    it("handleTabButtonClick honors data requirement and avoids state update when missing", () => {
        expect.assertions(2);
        const btn = document.createElement("button");
        btn.id = "tab_data"; // requiresData: true
        btn.className = "tab-button";
        root.appendChild(btn);

        mockGetState.mockImplementation((/* @type {any} */ key) =>
            key === "globalData" ? null : undefined
        );

        const prevent = vi.fn<VoidFn>();
        const stop = vi.fn<VoidFn>();
        tabStateManager.handleTabButtonClick(
            /* @type {any} */ {
                currentTarget: btn,
                preventDefault: prevent,
                stopPropagation: stop,
            }
        );

        expect(mockSetState).not.toHaveBeenCalled();
        expect(tabStateManager.extractTabName(btn.id)).toBe("data");
    });

    it("handleTabButtonClick with unknown tab id returns early without state change", () => {
        expect.assertions(2);
        const btn = document.createElement("button");
        btn.id = "tab_nonexistent";
        btn.className = "tab-button";
        root.appendChild(btn);

        const prevent = vi.fn<VoidFn>();
        const stop = vi.fn<VoidFn>();
        tabStateManager.handleTabButtonClick(
            /* @type {any} */ {
                currentTarget: btn,
                preventDefault: prevent,
                stopPropagation: stop,
            }
        );

        expect(mockSetState).not.toHaveBeenCalled();
        expect(tabStateManager.extractTabName(btn.id)).toBeNull();
    });

    it("handleTabButtonClick sets activeTab for valid click", () => {
        expect.assertions(2);
        const btn = document.createElement("button");
        btn.id = "tab_summary";
        btn.className = "tab-button";
        root.appendChild(btn);

        const prevent = vi.fn<VoidFn>();
        const stop = vi.fn<VoidFn>();
        tabStateManager.handleTabButtonClick(
            /* @type {any} */ {
                currentTarget: btn,
                preventDefault: prevent,
                stopPropagation: stop,
            }
        );

        expect(tabStateManager.extractTabName(btn.id)).toBe("summary");
        expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", {
            source: "TabStateManager.buttonClick",
        });
    });

    it("updateTabButtonStates toggles active and aria-selected", () => {
        expect.assertions(4);
        const a = document.createElement("button");
        a.id = "tab_summary";
        a.className = "tab-button";
        const b = document.createElement("button");
        b.id = "tab_map";
        b.className = "tab-button";
        root.append(a, b);

        tabStateManager.updateTabButtonStates("map");
        expect(a.classList.contains("active")).toBe(false);
        expect(a.getAttribute("aria-selected")).toBe("false");
        expect(b.classList.contains("active")).toBe(true);
        expect(b.getAttribute("aria-selected")).toBe("true");
    });

    it("updateContentVisibility hides all then shows active", () => {
        expect.assertions(16);
        Object.values(TAB_CONFIG).forEach((cfg) => {
            const el = document.createElement("div");
            el.id = cfg.contentId;
            el.style.display = "none";
            root.appendChild(el);
        });

        tabStateManager.updateContentVisibility("map");
        Object.entries(TAB_CONFIG).forEach(([name, cfg]) => {
            const el = /* @type {HTMLElement} */ document.getElementById(
                cfg.contentId
            );
            expect(el).toBeInstanceOf(HTMLElement);
            expect(el.style.display).toBe(name === "map" ? "block" : "none");
        });
    });

    it("handleTabChange updates previousTab and calls state update helpers", async () => {
        expect.assertions(5);
        const spyBtns = vi.spyOn(tabStateManager, "updateTabButtonStates");
        const spyContent = vi.spyOn(tabStateManager, "updateContentVisibility");
        const spySpecific = vi
            .spyOn(tabStateManager, "handleTabSpecificLogic")
            .mockResolvedValue();

        await tabStateManager.handleTabChange("map", "summary");
        expect(tabStateManager.previousTab).toBe("summary");
        expect(tabStateManager.getActiveTabInfo().previous).toBe("summary");
        expect(spyBtns).toHaveBeenCalledWith("map");
        expect(spyContent).toHaveBeenCalledWith("map");
        expect(spySpecific).toHaveBeenCalledWith("map");
    });

    it("handleAltFitTab sets iframe src safely", () => {
        expect.assertions(1);
        const iframe = document.createElement("iframe");
        iframe.id = "altfit_iframe";
        iframe.src = "about:blank";
        root.appendChild(iframe);

        tabStateManager.handleAltFitTab();
        expect(getAltFitIframePathname(iframe)).toBe("/ffv/index.html");
    });

    it("handleAltFitTab is idempotent when src already set", () => {
        expect.assertions(1);
        const iframe = document.createElement("iframe");
        iframe.id = "altfit_iframe";
        // Pre-set to expected value
        iframe.src = "ffv/index.html";
        root.appendChild(iframe);
        const before = iframe.src;

        tabStateManager.handleAltFitTab();
        expect(iframe.src).toBe(before);
    });

    it("handleAltFitTab does nothing for non-iframe element", () => {
        expect.assertions(1);
        const div = document.createElement("div");
        div.id = "altfit_iframe";
        root.appendChild(div);
        expect(() => tabStateManager.handleAltFitTab()).not.toThrow();
    });

    it("handleZwiftTab restores the external ZwiftMap launcher when content is blank", async () => {
        expect.assertions(4);
        const panel = document.createElement("div");
        panel.id = "content_zwift";
        root.appendChild(panel);

        await tabStateManager.handleZwiftTab();

        const link = panel.querySelector("a[data-external-link]");
        expect(link).toBeInstanceOf(HTMLAnchorElement);
        expect(link?.getAttribute("href")).toBe("https://zwiftmap.com/");
        expect(link?.textContent).toBe("Open ZwiftMap");
        expect(panel.querySelector(".zwift-external-panel")).toBeInstanceOf(
            HTMLDivElement
        );
    });

    it("handleSummaryTab renders when hash changes and stores lastDataHash", async () => {
        expect.assertions(3);
        const gd = { recordMesgs: [{ timestamp: 1 }, { timestamp: 2 }] };
        await tabStateManager.handleSummaryTab(gd);
        expect(gd.recordMesgs).toHaveLength(2);
        expect(/* @type {any} */ window.renderSummary).toHaveBeenCalledWith(gd);
        expect(mockSetState).toHaveBeenCalledWith(
            "summary.lastDataHash",
            expect.any(String),
            { source: "TabStateManager.handleSummaryTab" }
        );
    });

    it("updateContentVisibility warns for unknown tab", () => {
        expect.assertions(2);
        const warnSpy = vi.spyOn(console, "warn");
        tabStateManager.updateContentVisibility("unknown");
        expect(TAB_CONFIG.unknown).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(
            "[TabStateManager] Unknown tab: unknown"
        );
    });

    it("handleTabSpecificLogic catches errors and continues (summary throws)", async () => {
        expect.assertions(2);
        const view = /* @type {any} */ window.renderSummary;
        try {
            /* @type {any} */ vi.spyOn(
                window,
                "renderSummary"
            ).mockImplementation(() => {
                throw new Error("boom");
            });
            await expect(
                tabStateManager.handleTabSpecificLogic("summary")
            ).resolves.toBeUndefined();
            expect(tabStateManager.previousTab).toBe("summary");
        } finally {
            /* @type {any} */ window.renderSummary = view;
        }
    });

    it("handleTabSpecificLogic executes 'summary' branch normally and breaks", async () => {
        expect.assertions(3);
        // Ensure globalData present and summary hash differs so render occurs
        const gd = { recordMesgs: [{ timestamp: 1 }, { timestamp: 3 }] };
        mockGetState.mockImplementation((/* @type {any} */ key) => {
            if (key === "globalData") return gd;
            if (key === "summary.lastDataHash") return "different"; // force re-render
            return null;
        });
        /* @type {any} */ vi.spyOn(
            window,
            "renderSummary"
        ).mockImplementation();
        await expect(
            tabStateManager.handleTabSpecificLogic("summary")
        ).resolves.toBeUndefined();
        expect(/* @type {any} */ window.renderSummary).toHaveBeenCalledWith(gd);
        expect(mockSetState).toHaveBeenCalledWith(
            "summary.lastDataHash",
            expect.any(String),
            { source: "TabStateManager.handleSummaryTab" }
        );
    });

    it("handleSummaryTab no-op without renderer", async () => {
        expect.assertions(2);
        const view = /* @type {any} */ window.renderSummary;
        // @ts-ignore
        // @ts-ignore
        delete (/* @type {any} */ window.renderSummary);
        await tabStateManager.handleSummaryTab({ recordMesgs: [{}] });
        expect(window).not.toHaveProperty("renderSummary");
        // No throw and no setState
        expect(mockSetState).not.toHaveBeenCalledWith(
            "summary.lastDataHash",
            expect.anything(),
            expect.anything()
        );
        /* @type {any} */ window.renderSummary = view;
    });

    it("handleChartTab sets charts.tabActive true regardless of render state", async () => {
        expect.assertions(4);
        await tabStateManager.handleChartTab({ recordMesgs: [{}] });
        expect(mockGetState("ui.activeTab")).toBe("summary");
        expect(mockSetState).toHaveBeenCalledWith("charts.tabActive", true, {
            source: "TabStateManager.handleChartTab",
        });

        mockGetState.mockImplementation((/* @type {any} */ key) =>
            key === "charts" ? { isRendered: true } : { recordMesgs: [{}] }
        );
        await tabStateManager.handleChartTab({ recordMesgs: [{}] });
        expect(mockGetState("charts")).toStrictEqual({ isRendered: true });
        expect(mockSetState).toHaveBeenCalledWith(
            "charts.tabActive",
            true,
            expect.any(Object)
        );
    });

    it("handleMapTab renders once and marks isRendered", async () => {
        expect.assertions(5);
        await tabStateManager.handleMapTab({ recordMesgs: [{}] });
        expect(mockGetState("ui.activeTab")).toBe("summary");
        expect(/* @type {any} */ window.renderMap).toHaveBeenCalledWith();
        expect(mockSetState).toHaveBeenCalledWith("map.isRendered", true, {
            source: "TabStateManager.handleMapTab",
        });

        // Now report isRendered true – should not call render again
        const renderMapSpy = vi.spyOn(window, "renderMap").mockImplementation();
        renderMapSpy.mockClear();
        mockGetState.mockImplementation((/* @type {any} */ key) =>
            key === "map" ? { isRendered: true } : { recordMesgs: [{}] }
        );
        await tabStateManager.handleMapTab({ recordMesgs: [{}] });
        expect(mockGetState("map")).toStrictEqual({ isRendered: true });
        expect(renderMapSpy).not.toHaveBeenCalled();
    });

    it("handleDataTab moves background content when present, otherwise renders fresh tables", async () => {
        expect.assertions(2);
        const bg = document.createElement("div");
        bg.id = "background_data_container";
        bg.appendChild(document.createElement("div"));
        const vis = document.createElement("div");
        vis.id = "content_data";
        root.append(bg, vis);

        await tabStateManager.handleDataTab({ recordMesgs: [{}] });
        expect(vis.children).toHaveLength(1);

        // No background content -> call createTables
        await tabStateManager.handleDataTab({ recordMesgs: [{}] });
        expect(/* @type {any} */ window.createTables).toHaveBeenCalledWith({
            recordMesgs: [{}],
        });
    });

    it("handleChartTab/map/summary/data return early without data", async () => {
        expect.assertions(2);
        await tabStateManager.handleChartTab(null);
        await tabStateManager.handleMapTab(null);
        await tabStateManager.handleSummaryTab(null);
        await tabStateManager.handleDataTab(null);
        // no setState calls for these paths
        expect(mockGetState("ui.activeTab")).toBe("summary");
        expect(mockSetState).not.toHaveBeenCalledWith(
            "charts.tabActive",
            true,
            expect.anything()
        );
    });

    it("setupTabButtonHandlers attaches DOMContentLoaded handler when document is loading", () => {
        expect.assertions(7);
        // Force readyState to loading
        const origDesc = Object.getOwnPropertyDescriptor(
            Document.prototype,
            "readyState"
        );
        Object.defineProperty(document, "readyState", {
            configurable: true,
            get: () => "loading",
        });
        const addSpy = vi.spyOn(document, "addEventListener");
        tabStateManager.setupTabButtonHandlers();
        expect(addSpy).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function),
            expect.any(Object)
        );
        expect(addSpy.mock.calls[0][0]).toBe("DOMContentLoaded");
        expect(addSpy.mock.calls[0][1]).toBeInstanceOf(Function);

        // Cleanup should remove it
        const removeSpy = vi.spyOn(document, "removeEventListener");
        tabStateManager.cleanup();
        expect(removeSpy).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function)
        );
        expect(removeSpy.mock.calls[0][0]).toBe("DOMContentLoaded");
        expect(removeSpy.mock.calls[0][1]).toBeInstanceOf(Function);

        // Restore readyState
        expect(origDesc).toEqual(
            expect.objectContaining({
                configurable: true,
                get: expect.any(Function),
            })
        );
        Object.defineProperty(document, "readyState", origDesc!);
    });

    it("setupTabButtonHandlers attaches click listeners when document is ready", () => {
        expect.assertions(4);
        // Create some tab buttons
        const a = document.createElement("button");
        a.id = TAB_CONFIG.summary.id;
        a.className = "tab-button";
        const b = document.createElement("button");
        b.id = TAB_CONFIG.map.id;
        b.className = "tab-button";
        root.append(a, b);

        // Setup handlers
        tabStateManager.setupTabButtonHandlers();

        // Verify handlers work by clicking buttons and checking state changes
        const evt = new window.Event("click", { bubbles: true });
        a.dispatchEvent(evt);
        expect(a.id).toBe(TAB_CONFIG.summary.id);
        expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "summary", {
            source: "TabStateManager.buttonClick",
        });

        mockSetState.mockClear();
        b.dispatchEvent(evt);
        expect(b.id).toBe(TAB_CONFIG.map.id);
        expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "map", {
            source: "TabStateManager.buttonClick",
        });
    });

    it("updateTabAvailability toggles disabled state for requiresData tabs", () => {
        expect.assertions(10);
        // Create buttons for all tabs
        Object.values(TAB_CONFIG).forEach((cfg) => {
            const btn = document.createElement("button");
            btn.id = cfg.id;
            btn.className = "tab-button";
            root.appendChild(btn);
        });

        // Null/absent data -> disable
        tabStateManager.updateTabAvailability(null);
        const dataRequiredConfigs = Object.values(TAB_CONFIG).filter(
            (cfg) => cfg.requiresData
        );
        dataRequiredConfigs.forEach((cfg) => {
            const el = /* @type {any} */ document.getElementById(cfg.id);
            expect(el).toHaveProperty("disabled", true);
        });

        // Non-empty -> enable
        tabStateManager.updateTabAvailability({ recordMesgs: [{}] });
        dataRequiredConfigs.forEach((cfg) => {
            const el = /* @type {any} */ document.getElementById(cfg.id);
            expect(el).toHaveProperty("disabled", false);
        });
    });

    it("getActiveTabInfo returns elements and previous tab tracking", () => {
        expect.assertions(3);
        const btn = document.createElement("button");
        btn.id = "tab_map";
        btn.className = "tab-button";
        const content = document.createElement("div");
        content.id = "content_map";
        root.append(btn, content);

        mockGetState.mockImplementation((/* @type {any} */ key) =>
            key === "ui.activeTab" ? "map" : null
        );
        const info = /* @type {any} */ tabStateManager.getActiveTabInfo();
        expect(info.name).toBe("map");
        expect(info.element).toBe(btn);
        expect(info.contentElement).toBe(content);
    });

    it("getActiveTabInfo handles unknown activeTab gracefully", () => {
        expect.assertions(4);
        mockGetState.mockImplementationOnce((/* @type {any} */ key) =>
            key === "ui.activeTab" ? "unknown" : null
        );
        const info = /* @type {any} */ tabStateManager.getActiveTabInfo();
        expect(info.name).toBe("unknown");
        expect(info.config).toBeUndefined();
        expect(info.element).toBeNull();
        expect(info.contentElement).toBeNull();
    });

    it("hashData handles nulls and missing timestamps", () => {
        expect.assertions(2);
        // @ts-ignore accessing class method
        expect(tabStateManager.hashData(null)).toBe("");
        // missing timestamps -> 0 fallback
        // @ts-ignore accessing class method
        expect(tabStateManager.hashData({ recordMesgs: [{}, {}] })).toBe(
            "2-0-0"
        );
    });

    it("switchToTab validates name and sets state", () => {
        expect.assertions(4);
        expect({
            switchedToMissingTab: tabStateManager.switchToTab("nonexistent"),
        }).toStrictEqual({ switchedToMissingTab: false });
        expect(mockSetState).not.toHaveBeenCalledWith(
            "ui.activeTab",
            "nonexistent",
            expect.anything()
        );

        expect({
            switchedToMapTab: tabStateManager.switchToTab("map"),
        }).toStrictEqual({ switchedToMapTab: true });
        expect(mockSetState).toHaveBeenCalledWith("ui.activeTab", "map", {
            source: "TabStateManager.switchToTab",
        });
    });

    it("handleTabButtonClick returns early when event has no currentTarget", () => {
        expect.assertions(3);
        // Should not throw and should not set state
        expect(() =>
            tabStateManager.handleTabButtonClick(
                /* @type {any} */ {
                    currentTarget: null,
                    preventDefault() {},
                    stopPropagation() {},
                }
            )
        ).not.toThrow();
        expect(mockSetState).not.toHaveBeenCalled();
        expect(root).toHaveProperty("isConnected", true);
    });

    it("getDoc returns a usable document for DOM operations", () => {
        expect.assertions(1);
        // Ensure a content element exists
        const content = document.createElement("div");
        content.id = "content_summary";
        root.appendChild(content);
        // Should not throw when manipulating DOM via getDoc
        expect(() =>
            tabStateManager.updateContentVisibility("summary")
        ).not.toThrow();
    });

    it("handleTabSpecificLogic executes 'chartjs' branch and marks charts active", async () => {
        expect.assertions(2);
        mockGetState.mockImplementation((/* @type {any} */ key) => {
            if (key === "globalData") return { recordMesgs: [{}] };
            if (key === "charts") return { isRendered: false };
            return null;
        });
        await tabStateManager.handleTabSpecificLogic("chartjs");
        expect(mockGetState("charts")).toStrictEqual({ isRendered: false });
        expect(mockSetState).toHaveBeenCalledWith("charts.tabActive", true, {
            source: "TabStateManager.handleChartTab",
        });
    });

    it("handleTabSpecificLogic executes 'map' branch and calls renderMap", async () => {
        expect.assertions(2);
        mockGetState.mockImplementation((/* @type {any} */ key) => {
            if (key === "globalData") return { recordMesgs: [{}] };
            if (key === "map") return { isRendered: false };
            return null;
        });
        /* @type {any} */ vi.spyOn(window, "renderMap").mockImplementation();
        await tabStateManager.handleTabSpecificLogic("map");
        expect(mockGetState("map")).toStrictEqual({ isRendered: false });
        expect(/* @type {any} */ window.renderMap).toHaveBeenCalledWith();
    });

    it("handleTabSpecificLogic executes 'data' branch and calls createTables when no background content", async () => {
        expect.assertions(2);
        // No background_data_container present, so it should render fresh tables
        const vis = document.createElement("div");
        vis.id = "content_data";
        root.appendChild(vis);
        mockGetState.mockImplementation((/* @type {any} */ key) =>
            key === "globalData" ? { recordMesgs: [{}] } : null
        );
        /* @type {any} */ vi.spyOn(window, "createTables").mockImplementation();
        await tabStateManager.handleTabSpecificLogic("data");
        expect(vis.id).toBe("content_data");
        expect(/* @type {any} */ window.createTables).toHaveBeenCalledWith({
            recordMesgs: [{}],
        });
    });

    it("handleTabSpecificLogic executes 'altfit' branch and calls handleAltFitTab", async () => {
        expect.assertions(2);
        const iframe = document.createElement("iframe");
        iframe.id = "altfit_iframe";
        root.appendChild(iframe);
        const spy = vi.spyOn(tabStateManager, "handleAltFitTab");
        await tabStateManager.handleTabSpecificLogic("altfit");
        expect(getAltFitIframePathname(iframe)).toBe("/ffv/index.html");
        expect(spy).toHaveBeenCalledWith();
        spy.mockRestore();
    });

    it("handleTabButtonClick returns early when button already active", () => {
        expect.assertions(2);
        const btn = document.createElement("button");
        btn.id = "tab_map";
        btn.className = "tab-button active";
        root.appendChild(btn);

        tabStateManager.handleTabButtonClick(
            /* @type {any} */ {
                currentTarget: btn,
                preventDefault() {},
                stopPropagation() {},
            }
        );

        expect(mockSetState).not.toHaveBeenCalledWith(
            "ui.activeTab",
            "map",
            expect.anything()
        );
        expect(btn.classList.contains("active")).toBe(true);
    });

    it("handleTabSpecificLogic returns early for unknown tab (no config)", async () => {
        expect.assertions(2);
        await expect(
            tabStateManager.handleTabSpecificLogic(/* @type {any} */ "unknown")
        ).resolves.toBeUndefined();
        expect(TAB_CONFIG.unknown).toBeUndefined();
    });

    it("initializeSubscriptions callbacks invoke handlers when state changes", async () => {
        expect.assertions(4);
        // Re-initialize subscriptions after resetting mocks so calls are captured
        tabStateManager.initializeSubscriptions();
        // Retrieve the callbacks from the mock
        const calls = mockSubscribe.mock.calls;
        // Pick the most recent call for each key that provided a function callback
        /* @type {any} */
        const activeTabCall = [...calls]
            .filter(
                (/* @type {any} */ c) =>
                    c[0] === "ui.activeTab" && typeof c[1] === "function"
            )
            .at(-1);
        /* @type {any} */
        const dataFn = [...calls]
            .filter(
                (/* @type {any} */ c) =>
                    c[0] === "globalData" && typeof c[1] === "function"
            )
            .map((c) => c[1])
            .at(-1);
        expect(activeTabCall?.[1]).toBeTypeOf("function");
        // dataFn may be missing; that's acceptable in this environment

        const changeSpy = vi
            .spyOn(tabStateManager, "handleTabChange")
            .mockResolvedValue();
        // Invoke activeTab callback with different values to trigger handleTabChange path
        const activeTabCallback = /* @type {Function} */ activeTabCall[1];
        activeTabCallback("map", "summary");
        expect(changeSpy).toHaveBeenCalledWith("map", "summary");
        changeSpy.mockRestore();

        // Invoke globalData callback to hit updateTabAvailability call
        const btn = document.createElement("button");
        btn.id = TAB_CONFIG.summary.id;
        btn.className = "tab-button";
        root.appendChild(btn);
        expect(dataFn).toBeTypeOf("function");
        (dataFn as (data: { recordMesgs: unknown[] }) => void)({
            recordMesgs: [{}],
        });
        // Should have toggled disabled to false for requiresData button
        const summaryTabButton = document.getElementById(TAB_CONFIG.summary.id);
        expect(summaryTabButton).toHaveProperty("disabled", false);
    });

    it("updateTabButtonStates tolerates per-button failures (catch path)", () => {
        expect.assertions(2);
        const a = document.createElement("button");
        a.id = "tab_summary";
        a.className = "tab-button";
        // Force classList.toggle to throw to exercise catch
        const origToggle = a.classList.toggle.bind(a.classList);
        // @ts-ignore
        a.classList.toggle = /* @type {any} */ () => {
            throw new Error("boom");
        };
        const b = document.createElement("button");
        b.id = "tab_map";
        b.className = "tab-button";
        root.append(a, b);

        expect(() =>
            tabStateManager.updateTabButtonStates("map")
        ).not.toThrow();
        expect(b.classList.contains("active")).toBe(true);
        // Restore to avoid affecting other tests
        // @ts-ignore
        a.classList.toggle = origToggle;
    });

    it("handleTabSpecificLogic executes 'zwift' branch and restores the launcher", async () => {
        expect.assertions(3);
        const panel = document.createElement("div");
        panel.id = "content_zwift";
        root.appendChild(panel);

        await expect(
            tabStateManager.handleTabSpecificLogic("zwift")
        ).resolves.toBeUndefined();
        expect(TAB_CONFIG.zwift.id).toBe("tab_zwift");
        expect(panel.querySelector(".zwift-external-panel")).toBeInstanceOf(
            HTMLDivElement
        );
    });

    it("cleanup marks uninitialized and removes listeners without throwing", () => {
        expect.assertions(2);
        // Add some tab buttons to attach listeners in setup
        Object.values(TAB_CONFIG).forEach((cfg) => {
            const btn = document.createElement("button");
            btn.id = cfg.id;
            btn.className = "tab-button";
            root.appendChild(btn);
        });

        // Manually invoke setup to attach listeners (constructor already tried at import)
        // Call cleanup to ensure it detaches without error
        expect(() => tabStateManager.cleanup()).not.toThrow();
        // Internal flag should be false after cleanup so tests can re-init later
        expect(tabStateManager).toHaveProperty("isInitialized", false);
    });
});
