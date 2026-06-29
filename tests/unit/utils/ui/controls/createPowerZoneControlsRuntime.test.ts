import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserAbortControllerConstructor,
    BrowserHTMLElementConstructor,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getPowerZoneControlsRuntime,
    type PowerZoneControlsRuntimeScope,
} from "../../../../../electron-app/utils/ui/controls/createPowerZoneControlsRuntime.js";

function createUnavailableRuntimeScope(
    overrides: Partial<PowerZoneControlsRuntimeScope> = {}
): PowerZoneControlsRuntimeScope {
    return {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        getLocalStorage: () => undefined,
        ...overrides,
    };
}

describe("getPowerZoneControlsRuntime", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.unstubAllGlobals();
    });

    it("creates DOM elements and queries through the injected document", () => {
        expect.assertions(4);

        const runtime = getPowerZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            })
        );
        const section = runtime.createElement("div");
        section.id = "power-zone-controls";
        document.body.append(section);

        expect(runtime.createElement("button")).toBeInstanceOf(
            HTMLButtonElement
        );
        expect(runtime.querySelector("#power-zone-controls")).toBe(section);
        expect(runtime.isHTMLElement(section)).toBe(true);
        expect(runtime.isHTMLElement(document.createTextNode("power"))).toBe(
            false
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getPowerZoneControlsRuntime(
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

        const utils = getPowerZoneControlsRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("reads and writes through the injected storage runtime", () => {
        expect.assertions(3);

        const storage = new Map<string, string>();
        const runtime = getPowerZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getLocalStorage: () => ({
                    getItem: vi.fn((key: string) => storage.get(key) ?? null),
                    setItem: vi.fn((key: string, value: string) => {
                        storage.set(key, value);
                    }),
                }),
            })
        );

        expect(
            runtime.getStorageItem("power-zone-controls-collapsed")
        ).toBeNull();
        runtime.setStorageItem("power-zone-controls-collapsed", "true");
        expect(runtime.getStorageItem("power-zone-controls-collapsed")).toBe(
            "true"
        );
        expect(storage.get("power-zone-controls-collapsed")).toBe("true");
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(6);

        const runtime = getPowerZoneControlsRuntime(
            createUnavailableRuntimeScope()
        );
        const runtimeWithoutAbortController = getPowerZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
            })
        );
        const runtimeWithoutStorage = getPowerZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
            })
        );
        const runtimeWithInvalidAbortController = getPowerZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
                getDocument: () => document,
            })
        );
        const runtimeWithInvalidHTMLElement = getPowerZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
                getHTMLElement: () =>
                    "HTMLElement" as unknown as BrowserHTMLElementConstructor,
            })
        );
        const runtimeWithInvalidStorage = getPowerZoneControlsRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
                getLocalStorage: () => "localStorage" as unknown as Storage,
            })
        );

        expect(() => runtime.createElement("div")).toThrow(
            "createPowerZoneControls requires a document runtime"
        );
        expect(() =>
            runtimeWithoutAbortController.createAbortController()
        ).toThrow(
            "createPowerZoneControls requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "createPowerZoneControls requires an AbortController runtime"
        );
        expect(() => runtimeWithInvalidHTMLElement.isHTMLElement({})).toThrow(
            "createPowerZoneControls requires an HTMLElement runtime"
        );
        expect(() =>
            runtimeWithInvalidStorage.getStorageItem(
                "power-zone-controls-collapsed"
            )
        ).toThrow("createPowerZoneControls requires a localStorage runtime");
        expect(() =>
            runtimeWithoutStorage.getStorageItem(
                "power-zone-controls-collapsed"
            )
        ).toThrow("createPowerZoneControls requires a localStorage runtime");
    });

    it("fails clearly when required runtime providers are missing", () => {
        expect.assertions(4);

        expect(() =>
            getPowerZoneControlsRuntime({
                getAbortController: () => AbortController,
                getHTMLElement: () => HTMLElement,
                getLocalStorage: () => localStorage,
            } as unknown as PowerZoneControlsRuntimeScope).createElement("div")
        ).toThrow("createPowerZoneControls requires a document provider");
        expect(() =>
            getPowerZoneControlsRuntime({
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
                getLocalStorage: () => localStorage,
            } as unknown as PowerZoneControlsRuntimeScope).createAbortController()
        ).toThrow(
            "createPowerZoneControls requires an AbortController provider"
        );
        expect(() =>
            getPowerZoneControlsRuntime({
                getAbortController: () => AbortController,
                getDocument: () => document,
                getLocalStorage: () => localStorage,
            } as unknown as PowerZoneControlsRuntimeScope).isHTMLElement(
                document.body
            )
        ).toThrow("createPowerZoneControls requires an HTMLElement provider");
        expect(() =>
            getPowerZoneControlsRuntime({
                getAbortController: () => AbortController,
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            } as unknown as PowerZoneControlsRuntimeScope).getStorageItem(
                "power-zone-controls-collapsed"
            )
        ).toThrow("createPowerZoneControls requires a localStorage provider");
    });

    it("ignores legacy direct scope properties", () => {
        expect.assertions(4);

        const storage = new Map<string, string>();
        const runtime = getPowerZoneControlsRuntime({
            AbortController,
            document,
            HTMLElement,
            localStorage: {
                getItem: vi.fn((key: string) => storage.get(key) ?? null),
                setItem: vi.fn((key: string, value: string) => {
                    storage.set(key, value);
                }),
            },
        } as unknown as PowerZoneControlsRuntimeScope);

        expect(() => runtime.createElement("div")).toThrow(
            "createPowerZoneControls requires a document provider"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createPowerZoneControls requires an AbortController provider"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "createPowerZoneControls requires an HTMLElement provider"
        );
        expect(() =>
            runtime.getStorageItem("power-zone-controls-collapsed")
        ).toThrow("createPowerZoneControls requires a localStorage provider");
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(6);

        const runtime = getPowerZoneControlsRuntime();
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
        section.id = "power-defaults";
        documentRef.body.append(section);

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
        expect(runtime.querySelector("#power-defaults")).toBe(section);
        expect(runtime.isHTMLElement(section)).toBe(true);
        runtime.setStorageItem("power-zone-controls-collapsed", "true");
        expect(runtime.getStorageItem("power-zone-controls-collapsed")).toBe(
            "true"
        );
        expect(localStorage.setItem).toHaveBeenCalledWith(
            "power-zone-controls-collapsed",
            "true"
        );
        expect(localStorage.getItem).toHaveBeenCalledWith(
            "power-zone-controls-collapsed"
        );
    });
});
