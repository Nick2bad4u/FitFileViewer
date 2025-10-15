import { JSDOM } from "jsdom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createStateManagerMock } from "../../../../helpers/createStateManagerMock";
import { setGlobalData } from "../../../../../utils/state/domain/globalDataState.js";

const HELPERS = "../../../../../utils/rendering/helpers/renderSummaryHelpers.js";

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
                    /* ignore */
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

describe("showColModal interactions", () => {
    const origClipboard: any = (global.navigator as any)?.clipboard;

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

        document.body.innerHTML = "";
        vi.resetModules();
        // Ensure globalData exists for storage key building
        setGlobalData({ cachedFilePath: "/tmp/file.fit" }, "showColModal.beforeEach");
        // Clean localStorage
        localStorage.clear();
        // Mock clipboard to avoid errors if used elsewhere
        (global.navigator as any).clipboard = { writeText: vi.fn() };
    });

    afterEach(() => {
        (global.navigator as any).clipboard = origClipboard;
    });

    it("toggles Select All / Deselect All, persists on OK, and discards on Cancel", async () => {
        const { showColModal, getStorageKey, loadColPrefs } = await import(HELPERS);

        const allKeys = ["Speed", "Distance", "HeartRate"];
        let visible: string[] = ["Speed"]; // start with 1 selected
        const setVisibleColumns = vi.fn((cols: string[]) => {
            visible = [...cols];
        });
        const reRender = vi.fn();

        showColModal({ allKeys, visibleColumns: visible, setVisibleColumns, renderTable: reRender });

        // There should be an overlay in the DOM
        const overlay = document.querySelector(".summary-col-modal-overlay") as HTMLElement;
        expect(overlay).toBeTruthy();

        // The button text should be "Select All" initially (not all selected)
        const selectAllBtn = overlay.querySelector(".select-all-btn") as HTMLButtonElement;
        expect(selectAllBtn).toBeTruthy();
        expect(selectAllBtn.textContent).toMatch(/Select All/i);

        // Click Select All -> becomes Deselect All and setVisibleColumns called with all keys
        selectAllBtn.click();
        expect(selectAllBtn.textContent).toMatch(/Deselect All/i);
        expect(setVisibleColumns).toHaveBeenCalled();
        expect(visible).toEqual(allKeys);
        expect(reRender).toHaveBeenCalledTimes(1);

        // Click OK persists to localStorage
        const okBtn = overlay.querySelector(".modal-actions .themed-btn:last-of-type") as HTMLButtonElement;
        expect(okBtn).toBeTruthy();
        okBtn.click();
        // Overlay removed
        expect(document.querySelector(".summary-col-modal-overlay")).toBeNull();

        const key = getStorageKey((global as any).window.globalData, allKeys);
        const stored = loadColPrefs(key, allKeys);
        expect(stored).toEqual(allKeys);

        // Open again and then Cancel should not change stored value
        showColModal({ allKeys, visibleColumns: ["Speed"], setVisibleColumns, renderTable: reRender });
        const overlay2 = document.querySelector(".summary-col-modal-overlay") as HTMLElement;
        const cancelBtn = overlay2.querySelector(".modal-actions .themed-btn") as HTMLButtonElement; // first is Cancel
        cancelBtn.click();
        const storedAfterCancel = loadColPrefs(key);
        expect(storedAfterCancel).toEqual(allKeys); // unchanged
    });

    it("shift-click selects a range and persists immediately via saveColPrefs in handlers", async () => {
        const { showColModal, getStorageKey, loadColPrefs } = await import(HELPERS);

        const allKeys = ["A", "B", "C", "D", "E"];
        let visible: string[] = [];
        const setVisibleColumns = vi.fn((cols: string[]) => {
            visible = [...cols];
        });
        const reRender = vi.fn();

        showColModal({ allKeys, visibleColumns: visible, setVisibleColumns, renderTable: reRender });

        const overlay = document.querySelector(".summary-col-modal-overlay") as HTMLElement;
        const checkboxes = Array.from(overlay.querySelectorAll<HTMLLabelElement>(".col-list label"));
        // First label is the disabled "Type" checkbox, skip it; actual keys begin at index 1
        const keyCheckbox = (idx: number) => checkboxes[idx].querySelector("input") as HTMLInputElement;

        // Click index 2 ("C") to set lastCheckedIndex
        keyCheckbox(3).click(); // labels: 0 Type, 1 A, 2 B, 3 C, 4 D, 5 E
        expect(visible).toEqual(["C"]);

        // Now shift-mousedown on index 5 ("E") to select range C..E
        const e = new MouseEvent("mousedown", { bubbles: true, cancelable: true, shiftKey: true });
        keyCheckbox(5).dispatchEvent(e);
        // After range select, visible should be [C, D, E] sorted by allKeys order
        expect(visible).toEqual(["C", "D", "E"]);
        // Re-render called from handler
        expect(reRender).toHaveBeenCalled();

        // storage updated by handler side-effect
        const key = getStorageKey((global as any).window.globalData, allKeys);
        const stored = loadColPrefs(key, allKeys);
        expect(stored).toEqual(["C", "D", "E"]);
    });
});
