import { JSDOM } from "jsdom";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { createStateManagerMock } from "../../../../helpers/createStateManagerMock";
import { setGlobalData } from "../../../../../utils/state/domain/globalDataState.js";

// From tests/unit/utils/rendering/helpers -> utils/... requires going up 5 levels
const SUT = "../../../../../utils/rendering/helpers/renderSummaryHelpers.js";

const ensureDom = () => {
    const createMemoryStorage = () => {
        const store = new Map<string, string>();
        return {
            clear: () => store.clear(),
            getItem: (key: string) => store.get(String(key)) ?? null,
            key: (index: number) => Array.from(store.keys())[index] ?? null,
            removeItem: (key: string) => {
                store.delete(String(key));
            },
            setItem: (key: string, value: string) => {
                store.set(String(key), String(value));
            },
            get length() {
                return store.size;
            },
        } satisfies Storage;
    };

    const installGlobals = (sourceWindow: Window & typeof globalThis) => {
        const assignIfMissing = (key: string, value: unknown) => {
            const current = (globalThis as Record<string, unknown>)[key];
            if (current !== undefined && current !== null) {
                return;
            }
            try {
                Object.defineProperty(globalThis, key, {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value,
                });
            } catch {
                try {
                    (globalThis as Record<string, unknown>)[key] = value as never;
                } catch {
                    /* ignore assignment errors */
                }
            }
        };

        assignIfMissing("navigator", sourceWindow.navigator);
        assignIfMissing("HTMLElement", sourceWindow.HTMLElement);
        const storage = sourceWindow.localStorage ?? createMemoryStorage();
        assignIfMissing("localStorage", storage);
        if (!sourceWindow.localStorage) {
            try {
                Object.defineProperty(sourceWindow, "localStorage", {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: storage,
                });
            } catch {
                (sourceWindow as any).localStorage = storage;
            }
        }
        assignIfMissing("MouseEvent", sourceWindow.MouseEvent);
        assignIfMissing("HTMLButtonElement", (sourceWindow as any).HTMLButtonElement);
    };

    if (typeof window === "undefined" || typeof document === "undefined") {
        const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
        try {
            Object.defineProperty(globalThis, "window", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: dom.window,
            });
            Object.defineProperty(globalThis, "document", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: dom.window.document,
            });
        } catch {
            (globalThis as any).window = dom.window;
            (globalThis as any).document = dom.window.document;
        }
        installGlobals(dom.window as unknown as Window & typeof globalThis);
        return;
    }

    installGlobals(window as unknown as Window & typeof globalThis);
};

type StateManagerHarness = ReturnType<typeof createStateManagerMock>;
type MockFn = ReturnType<typeof vi.fn>;

type StateManagerRefs = {
    harness?: StateManagerHarness;
    getStateMock?: MockFn;
    setStateMock?: MockFn;
    updateStateMock?: MockFn;
    subscribeMock?: MockFn;
};

const stateManagerRefs = vi.hoisted((): StateManagerRefs => ({
    harness: undefined,
    getStateMock: undefined,
    setStateMock: undefined,
    updateStateMock: undefined,
    subscribeMock: undefined,
}));

vi.mock("../../../../../utils/state/core/stateManager.js", () => {
    if (!stateManagerRefs.harness) {
        const harness = createStateManagerMock();
        stateManagerRefs.harness = harness;
        stateManagerRefs.getStateMock = vi.fn((path?: string) => harness.getState(path));
        stateManagerRefs.setStateMock = vi.fn((path: string, value: unknown, options?: any) =>
            harness.setState(path, value, options)
        );
        stateManagerRefs.updateStateMock = vi.fn((path: string, patch: Record<string, unknown>, options?: any) =>
            harness.updateState(path, patch, options)
        );
        stateManagerRefs.subscribeMock = vi.fn((path: string, listener: (value: unknown) => void) =>
            harness.subscribe(path, listener as any)
        );
    }

    return {
        getState: stateManagerRefs.getStateMock!,
        setState: stateManagerRefs.setStateMock!,
        updateState: stateManagerRefs.updateStateMock!,
        subscribe: stateManagerRefs.subscribeMock!,
    };
});

const ensureStateManagerRefs = () => {
    const { harness, getStateMock, setStateMock, updateStateMock, subscribeMock } = stateManagerRefs;
    if (!harness || !getStateMock || !setStateMock || !updateStateMock || !subscribeMock) {
        throw new Error("State manager mocks failed to initialize");
    }
    return { harness, getStateMock, setStateMock, updateStateMock, subscribeMock };
};

const { harness: stateManagerHarness, getStateMock, setStateMock, updateStateMock, subscribeMock } =
    ensureStateManagerRefs();

describe("renderSummaryHelpers core functions", () => {
    /** Save originals to restore after tests */
    const origWindow: any = global.window;
    const origLocalStorage: any = global.localStorage;

    beforeEach(() => {
        ensureDom();
        stateManagerHarness.reset();
        vi.clearAllMocks();
        getStateMock.mockImplementation((path?: string) => stateManagerHarness.getState(path));
        setStateMock.mockImplementation((path: string, value: unknown, options?: any) =>
            stateManagerHarness.setState(path, value, options)
        );
        updateStateMock.mockImplementation((path: string, patch: Record<string, unknown>, options?: any) =>
            stateManagerHarness.updateState(path, patch, options)
        );
        subscribeMock.mockImplementation((path: string, listener: (value: unknown) => void) =>
            stateManagerHarness.subscribe(path, listener as any)
        );

        // Ensure jsdom window/localStorage exist
        expect(global.window).toBeDefined();
        expect(global.localStorage).toBeDefined();
        // Clean localStorage and reset modules/mocks
        global.localStorage.clear();
        vi.resetModules();
        // Clean any globals we may set
        setGlobalData(null, "renderSummaryHelpers.beforeEach");
        (global.window as any).activeFitFileName = undefined;
    });

    afterEach(() => {
        // Restore globals as safety (jsdom resets between tests, but keep explicit)
        global.window = origWindow;
        global.localStorage = origLocalStorage;
    });

    it("getRowLabel returns Summary or Lap N", async () => {
        const { getRowLabel } = await import(SUT);
        expect(getRowLabel(0, false)).toBe("Summary");
        expect(getRowLabel(0, true)).toBe("Lap 1");
        expect(getRowLabel(2, true)).toBe("Lap 3");
    });

    it("getStorageKey prefers window.globalData.cachedFilePath and encodes it", async () => {
        const { getStorageKey } = await import(SUT);
        setGlobalData({ cachedFilePath: "C:/Users/Me/My Activity.fit" }, "renderSummaryHelpers.cachedFile");
        const key = getStorageKey({});
        expect(key.startsWith("summaryColSel_")).toBe(true);
        expect(key).toContain(encodeURIComponent("C:/Users/Me/My Activity.fit"));
    });

    it("getStorageKey falls back to data.cachedFilePath when window.globalData missing", async () => {
        const { getStorageKey } = await import(SUT);
        // ensure no globalData
        setGlobalData(null, "renderSummaryHelpers.noGlobalData");
        const data: any = { cachedFilePath: "/tmp/äctivity file.fit" };
        const key = getStorageKey(data);
        expect(key).toBe("summaryColSel_" + encodeURIComponent("/tmp/äctivity file.fit"));
    });

    it("getStorageKey falls back to window.activeFitFileName and defaults otherwise", async () => {
        const { getStorageKey } = await import(SUT);
        // Remove others
        setGlobalData(null, "renderSummaryHelpers.activeFileName");
        const keyDefault = getStorageKey(undefined as any);
        expect(keyDefault).toBe("summaryColSel_default");
        // Now set activeFitFileName
        (global.window as any).activeFitFileName = "JustAName.fit";
        const keyActive = getStorageKey(undefined as any);
        expect(keyActive).toBe("summaryColSel_" + encodeURIComponent("JustAName.fit"));
    });

    it("loadColPrefs returns array of strings from localStorage and handles bad values", async () => {
        const { loadColPrefs } = await import(SUT);
        const key = "summaryColSel_test";
        // Valid array
        localStorage.setItem(key, JSON.stringify(["a", "b", "c"]));
        expect(loadColPrefs(key)).toEqual(["a", "b", "c"]);
        // Not an array -> null
        localStorage.setItem(key, JSON.stringify({ a: 1 }));
        expect(loadColPrefs(key)).toBeNull();
        // Invalid JSON -> null
        localStorage.setItem(key, "not-json");
        expect(loadColPrefs(key)).toBeNull();
        // getItem throwing -> null (caught)
        const origGet = localStorage.getItem;
        (localStorage as any).getItem = vi.fn(() => {
            throw new Error("boom");
        });
        expect(loadColPrefs(key)).toBeNull();
        // restore
        (localStorage as any).getItem = origGet;
    });

    it("saveColPrefs stores JSON and swallows errors", async () => {
        const { saveColPrefs } = await import(SUT);
        const key = "summaryColSel_store";
        const cols = ["Speed", "Distance"];
        saveColPrefs(key, cols, undefined as any);
        expect(JSON.parse(localStorage.getItem(key) || "[]")).toEqual(cols);
        // setItem throwing should not propagate
        const origSet = localStorage.setItem;
        (localStorage as any).setItem = vi.fn(() => {
            throw new Error("nope");
        });
        expect(() => saveColPrefs(key, ["X"], undefined as any)).not.toThrow();
        // restore
        (localStorage as any).setItem = origSet;
    });
});
