import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserAbortControllerConstructor,
    BrowserHTMLElementConstructor,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getHRZoneControlsRuntime,
    type HRZoneControlsRuntimeScope,
} from "../../../../../electron-app/utils/ui/controls/createHRZoneControlsRuntime.js";

function createUnavailableRuntimeScope(
    overrides: Partial<HRZoneControlsRuntimeScope> = {}
): HRZoneControlsRuntimeScope {
    return {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        getLocalStorage: () => undefined,
        ...overrides,
    };
}

describe("getHRZoneControlsRuntime", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.unstubAllGlobals();
    });

    it("creates DOM elements and queries through the injected document", () => {
        expect.assertions(4);

        const runtime = getHRZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            })
        );
        const section = runtime.createElement("div");
        section.id = "hr-zone-controls";
        document.body.append(section);

        expect(runtime.createElement("button")).toBeInstanceOf(
            HTMLButtonElement
        );
        expect(runtime.querySelector("#hr-zone-controls")).toBe(section);
        expect(runtime.isHTMLElement(section)).toBe(true);
        expect(runtime.isHTMLElement(document.createTextNode("hr"))).toBe(
            false
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getHRZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getAbortController: () => AbortController,
            })
        );
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getHRZoneControlsRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("reads and writes through the injected storage runtime", () => {
        expect.assertions(3);

        const storage = new Map<string, string>();
        const runtime = getHRZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getLocalStorage: () => ({
                    getItem: vi.fn((key: string) => storage.get(key) ?? null),
                    setItem: vi.fn((key: string, value: string) => {
                        storage.set(key, value);
                    }),
                }),
            })
        );

        expect(runtime.getStorageItem("hr-zone-controls-collapsed")).toBeNull();
        runtime.setStorageItem("hr-zone-controls-collapsed", "true");
        expect(runtime.getStorageItem("hr-zone-controls-collapsed")).toBe(
            "true"
        );
        expect(storage.get("hr-zone-controls-collapsed")).toBe("true");
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(6);

        const runtime = getHRZoneControlsRuntime(
            createUnavailableRuntimeScope()
        );
        const runtimeWithoutAbortController = getHRZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
            })
        );
        const runtimeWithoutStorage = getHRZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
            })
        );
        const runtimeWithInvalidAbortController = getHRZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
                getDocument: () => document,
            })
        );
        const runtimeWithInvalidHTMLElement = getHRZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
                getHTMLElement: () =>
                    "HTMLElement" as unknown as BrowserHTMLElementConstructor,
            })
        );
        const runtimeWithInvalidStorage = getHRZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
                getLocalStorage: () => "localStorage" as unknown as Storage,
            })
        );

        expect(() => runtime.createElement("div")).toThrow(
            "createHRZoneControls requires a document runtime"
        );
        expect(() =>
            runtimeWithoutAbortController.createAbortController()
        ).toThrow("createHRZoneControls requires an AbortController runtime");
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow("createHRZoneControls requires an AbortController runtime");
        expect(() => runtimeWithInvalidHTMLElement.isHTMLElement({})).toThrow(
            "createHRZoneControls requires an HTMLElement runtime"
        );
        expect(() =>
            runtimeWithInvalidStorage.getStorageItem(
                "hr-zone-controls-collapsed"
            )
        ).toThrow("createHRZoneControls requires a localStorage runtime");
        expect(() =>
            runtimeWithoutStorage.getStorageItem("hr-zone-controls-collapsed")
        ).toThrow("createHRZoneControls requires a localStorage runtime");
    });

    it("fails clearly when required runtime providers are missing", () => {
        expect.assertions(4);

        expect(() =>
            getHRZoneControlsRuntime({
                getAbortController: () => AbortController,
                getHTMLElement: () => HTMLElement,
                getLocalStorage: () => localStorage,
            } as unknown as HRZoneControlsRuntimeScope).createElement("div")
        ).toThrow("createHRZoneControls requires a document provider");
        expect(() =>
            getHRZoneControlsRuntime({
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
                getLocalStorage: () => localStorage,
            } as unknown as HRZoneControlsRuntimeScope).createAbortController()
        ).toThrow("createHRZoneControls requires an AbortController provider");
        expect(() =>
            getHRZoneControlsRuntime({
                getAbortController: () => AbortController,
                getDocument: () => document,
                getLocalStorage: () => localStorage,
            } as unknown as HRZoneControlsRuntimeScope).isHTMLElement(
                document.body
            )
        ).toThrow("createHRZoneControls requires an HTMLElement provider");
        expect(() =>
            getHRZoneControlsRuntime({
                getAbortController: () => AbortController,
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            } as unknown as HRZoneControlsRuntimeScope).getStorageItem(
                "hr-zone-controls-collapsed"
            )
        ).toThrow("createHRZoneControls requires a localStorage provider");
    });

    it("ignores legacy direct scope properties", () => {
        expect.assertions(4);

        const storage = new Map<string, string>();
        const runtime = getHRZoneControlsRuntime({
            AbortController,
            document,
            HTMLElement,
            localStorage: {
                getItem: vi.fn((key: string) => storage.get(key) ?? null),
                setItem: vi.fn((key: string, value: string) => {
                    storage.set(key, value);
                }),
            },
        } as unknown as HRZoneControlsRuntimeScope);

        expect(() => runtime.createElement("div")).toThrow(
            "createHRZoneControls requires a document provider"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createHRZoneControls requires an AbortController provider"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "createHRZoneControls requires an HTMLElement provider"
        );
        expect(() =>
            runtime.getStorageItem("hr-zone-controls-collapsed")
        ).toThrow("createHRZoneControls requires a localStorage provider");
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(6);

        const runtime = getHRZoneControlsRuntime();
        const documentRef = document;
        const storage = new Map<string, string>();
        const localStorage = {
            getItem: vi.fn((key: string) => storage.get(key) ?? null),
            setItem: vi.fn((key: string, value: string) => {
                storage.set(key, value);
            }),
        };

        vi.stubGlobal("AbortController", AbortController);
        vi.stubGlobal("document", documentRef);
        vi.stubGlobal("HTMLElement", HTMLElement);
        vi.stubGlobal("localStorage", localStorage);

        const section = runtime.createElement("div");
        section.id = "hr-defaults";
        documentRef.body.append(section);

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
        expect(runtime.querySelector("#hr-defaults")).toBe(section);
        expect(runtime.isHTMLElement(section)).toBe(true);
        runtime.setStorageItem("hr-zone-controls-collapsed", "true");
        expect(runtime.getStorageItem("hr-zone-controls-collapsed")).toBe(
            "true"
        );
        expect(localStorage.setItem).toHaveBeenCalledWith(
            "hr-zone-controls-collapsed",
            "true"
        );
        expect(localStorage.getItem).toHaveBeenCalledWith(
            "hr-zone-controls-collapsed"
        );
    });
});
