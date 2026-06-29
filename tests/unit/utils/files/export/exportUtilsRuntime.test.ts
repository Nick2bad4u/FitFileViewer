// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getExportUtilsRuntime,
    type ExportUtilsRuntimeScope,
} from "../../../../../electron-app/utils/files/export/exportUtilsRuntime.js";
import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";

function createExportUtilsRuntimeScope(
    overrides: Partial<ExportUtilsRuntimeScope> = {}
): ExportUtilsRuntimeScope {
    return {
        getAbortController: () => undefined,
        getConfirmDangerousAction: () => undefined,
        getDocument: () => undefined,
        getDocumentEventTarget: () => undefined,
        getHTMLElement: () => undefined,
        getOpenPrintWindow: () => undefined,
        getProcessEnvironmentValue: () => undefined,
        getSecureRandomCrypto: () => undefined,
        getStorage: () => null,
        ...overrides,
    };
}

describe("exportUtilsRuntime", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.unstubAllGlobals();
    });

    it("uses default browser function providers without exposing a window scope", () => {
        expect.assertions(6);

        const confirmDangerousAction = vi.fn(() => true);
        const popup = {} as Window;
        const openPrintWindow = vi.fn(() => popup);
        vi.stubGlobal("confirm", confirmDangerousAction);
        vi.stubGlobal("open", openPrintWindow);

        const exportUtils = getExportUtilsRuntime();

        expect(
            exportUtils.confirmDangerousAction("Clear saved export tokens?")
        ).toBe(true);
        expect(
            exportUtils.openPrintWindow("", "_blank", "noopener,noreferrer")
        ).toBe(popup);
        expect(confirmDangerousAction).toHaveBeenCalledWith(
            "Clear saved export tokens?"
        );
        expect(confirmDangerousAction.mock.contexts[0]).toBe(globalThis);
        expect(openPrintWindow).toHaveBeenCalledWith(
            "",
            "_blank",
            "noopener,noreferrer"
        );
        expect(openPrintWindow.mock.contexts[0]).toBe(globalThis);
    });

    it("confirms dangerous actions through the scoped confirmation runtime", () => {
        expect.assertions(2);

        const confirmDangerousAction = vi.fn(() => true),
            runtime = getExportUtilsRuntime(
                createExportUtilsRuntimeScope({
                    getConfirmDangerousAction: () => confirmDangerousAction,
                })
            );

        expect(
            runtime.confirmDangerousAction("Clear saved export tokens?")
        ).toBe(true);
        expect(confirmDangerousAction).toHaveBeenCalledWith(
            "Clear saved export tokens?"
        );
    });

    it("rejects dangerous actions when no confirmation runtime exists", () => {
        expect.assertions(1);

        expect(
            getExportUtilsRuntime(
                createExportUtilsRuntimeScope()
            ).confirmDangerousAction("Clear saved export tokens?")
        ).toBe(false);
    });

    it("opens print windows through the scoped print-window runtime", () => {
        expect.assertions(2);

        const popup = {} as Window;
        const openPrintWindow = vi.fn(() => popup);
        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getOpenPrintWindow: () => openPrintWindow,
            })
        );

        expect(
            runtime.openPrintWindow("", "_blank", "noopener,noreferrer")
        ).toBe(popup);
        expect(openPrintWindow).toHaveBeenCalledWith(
            "",
            "_blank",
            "noopener,noreferrer"
        );
    });

    it("reads process environment values through the scoped runtime", () => {
        expect.assertions(3);

        const getProcessEnvironmentValue = vi.fn((name: string) =>
            name === "FFV_DEBUG_UPLOADS" ? "1" : undefined
        );
        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getProcessEnvironmentValue,
            })
        );

        expect(runtime.getProcessEnvironmentValue("FFV_DEBUG_UPLOADS")).toBe(
            "1"
        );
        expect(runtime.getProcessEnvironmentValue("OTHER")).toBe(undefined);
        expect(getProcessEnvironmentValue).toHaveBeenCalledTimes(2);
    });

    it("resolves storage through the scoped storage runtime", () => {
        expect.assertions(1);

        const storage = {
            getItem: vi.fn<Storage["getItem"]>(),
            removeItem: vi.fn<Storage["removeItem"]>(),
            setItem: vi.fn<Storage["setItem"]>(),
        };
        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getStorage: () => storage,
            })
        );

        expect(runtime.getStorage()).toBe(storage);
    });

    it("ignores invalid scoped storage runtimes", () => {
        expect.assertions(2);

        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getStorage: () => ({}) as Storage,
            })
        );
        const malformedMethodRuntime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getStorage: () =>
                    ({
                        getItem: "not-a-function",
                        removeItem: "not-a-function",
                        setItem: "not-a-function",
                    }) as unknown as Storage,
            })
        );

        expect(runtime.getStorage()).toBeNull();
        expect(malformedMethodRuntime.getStorage()).toBeNull();
    });

    it("resolves secure randomness through the scoped crypto runtime", () => {
        expect.assertions(1);

        const crypto = {
            getRandomValues: vi.fn<Crypto["getRandomValues"]>(),
        };
        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getSecureRandomCrypto: () => crypto,
            })
        );

        expect(runtime.getSecureRandomScope()).toStrictEqual({ crypto });
    });

    it("ignores invalid scoped secure-random runtimes", () => {
        expect.assertions(2);

        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getSecureRandomCrypto: () => ({}) as Crypto,
            })
        );
        const malformedMethodRuntime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getSecureRandomCrypto: () =>
                    ({
                        getRandomValues: "not-a-function",
                    }) as unknown as Crypto,
            })
        );

        expect(runtime.getSecureRandomScope()).toStrictEqual({});
        expect(malformedMethodRuntime.getSecureRandomScope()).toStrictEqual({});
    });

    it("returns null when print-window opening is unavailable", () => {
        expect.assertions(1);

        expect(
            getExportUtilsRuntime(
                createExportUtilsRuntimeScope()
            ).openPrintWindow("", "_blank", "noopener,noreferrer")
        ).toBeNull();
    });

    it("creates abort controllers through the scoped runtime", () => {
        expect.assertions(2);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }

        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getAbortController: () =>
                    TestAbortController as unknown as BrowserAbortControllerConstructor,
            })
        );

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(created).toBe(true);
    });

    it("uses browser runtime providers for production browser defaults", () => {
        expect.assertions(5);

        const runtime = getExportUtilsRuntime();
        const link = document.createElement("a");
        const button = document.createElement("button");

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);

        runtime.appendToBody(link);
        runtime.appendToBody(button);
        button.focus();

        expect(document.body.contains(link)).toBe(true);
        expect(runtime.getActiveElement()).toBe(button);
        expect(runtime.getSecureRandomScope()).toStrictEqual({
            crypto: globalThis.crypto,
        });
        expect(runtime.getStorage()).toBe(localStorage);
    });

    it("registers document keydown listeners through the scoped event target", () => {
        expect.assertions(4);

        const controller = new AbortController();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        let keydownCount = 0;
        const listener = () => {
            keydownCount += 1;
        };
        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getDocument: () => documentEventTarget,
                getDocumentEventTarget: () => documentEventTarget,
            })
        );

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        const link = documentEventTarget.createElement("a");
        runtime.appendToBody(link);
        documentEventTarget.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" })
        );

        expect(addEventListener).toHaveBeenCalledWith("keydown", listener, {
            signal: controller.signal,
        });
        expect(keydownCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(1);
        expect(documentEventTarget.body.contains(link)).toBe(true);
    });

    it("derives document keydown listeners from the scoped document provider", () => {
        expect.assertions(4);

        const controller = new AbortController();
        const documentRef = document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        let keydownCount = 0;
        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        runtime.addDocumentKeydownListener(
            () => {
                keydownCount += 1;
            },
            { signal: controller.signal }
        );
        documentRef.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" })
        );

        expect(addEventListener).toHaveBeenCalledWith(
            "keydown",
            expect.any(Function),
            {
                signal: controller.signal,
            }
        );
        expect(addEventListener.mock.contexts[0]).toBe(documentRef);
        expect(keydownCount).toBe(1);
        expect(document.body).not.toBe(documentRef.body);
    });

    it("routes document keydown listeners through provider functions", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        let keydownCount = 0;
        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getDocumentEventTarget: () => documentEventTarget,
            })
        );

        runtime.addDocumentKeydownListener(
            () => {
                keydownCount += 1;
            },
            { signal: controller.signal }
        );
        documentEventTarget.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" })
        );

        expect(keydownCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("resolves active elements through scoped document and HTMLElement providers", () => {
        expect.assertions(2);

        const button = document.createElement("button");
        let activeElement: Element | null = button;
        const runtime = getExportUtilsRuntime(
            createExportUtilsRuntimeScope({
                getDocument: () => ({ activeElement }) as unknown as Document,
                getHTMLElement: () => HTMLElement,
            })
        );

        expect(runtime.getActiveElement()).toBe(button);

        activeElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        expect(runtime.getActiveElement()).toBeNull();
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(15);

        const storage = {
            getItem: vi.fn<Storage["getItem"]>(),
            removeItem: vi.fn<Storage["removeItem"]>(),
            setItem: vi.fn<Storage["setItem"]>(),
        };
        const crypto = {
            getRandomValues: vi.fn<Crypto["getRandomValues"]>(),
        };
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const confirmDangerousAction = vi.fn(() => true);
        const openPrintWindow = vi.fn(() => ({}) as Window);
        const processEnvironmentValue = vi.fn(() => "1");
        const runtime = getExportUtilsRuntime({
            ...createExportUtilsRuntimeScope(),
            AbortController,
            confirmDangerousAction,
            crypto,
            documentEventTarget,
            HTMLElement,
            localStorage: storage,
            openPrintWindow,
            processEnvironmentValue,
        } as unknown as ExportUtilsRuntimeScope);

        expect(
            runtime.confirmDangerousAction("Clear saved export tokens?")
        ).toBe(false);
        expect(runtime.openPrintWindow("", "_blank", "noopener")).toBeNull();
        expect(runtime.getStorage()).toBeNull();
        expect(runtime.getProcessEnvironmentValue("FFV_DEBUG_UPLOADS")).toBe(
            undefined
        );
        expect(runtime.getSecureRandomScope()).toStrictEqual({});
        expect(runtime.createAbortController).toThrow(
            "exportUtils requires an AbortController runtime"
        );
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow("exportUtils requires a document event-target runtime");
        expect(() => runtime.appendToBody(document.createElement("a"))).toThrow(
            "exportUtils requires a document runtime"
        );
        expect(() => runtime.getActiveElement()).toThrow(
            "exportUtils requires a document runtime"
        );
        expect(confirmDangerousAction).not.toHaveBeenCalled();
        expect(openPrintWindow).not.toHaveBeenCalled();
        expect(storage.getItem).not.toHaveBeenCalled();
        expect(processEnvironmentValue).not.toHaveBeenCalled();
        expect(crypto.getRandomValues).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
    });

    it("throws when explicit runtime dependencies are unavailable", () => {
        expect.assertions(5);

        expect(() =>
            getExportUtilsRuntime(
                createExportUtilsRuntimeScope()
            ).createAbortController()
        ).toThrow("exportUtils requires an AbortController runtime");
        expect(() =>
            getExportUtilsRuntime(
                createExportUtilsRuntimeScope()
            ).addDocumentKeydownListener(() => undefined, {})
        ).toThrow("exportUtils requires a document event-target runtime");
        expect(() =>
            getExportUtilsRuntime(createExportUtilsRuntimeScope()).appendToBody(
                document.createElement("a")
            )
        ).toThrow("exportUtils requires a document runtime");
        expect(() =>
            getExportUtilsRuntime(
                createExportUtilsRuntimeScope()
            ).getActiveElement()
        ).toThrow("exportUtils requires a document runtime");
        expect(() =>
            getExportUtilsRuntime(
                createExportUtilsRuntimeScope({
                    getDocument: () => document,
                })
            ).getActiveElement()
        ).toThrow("exportUtils requires an HTMLElement runtime");
    });

    it("throws when required runtime providers are omitted", () => {
        expect.assertions(9);

        const scope = createExportUtilsRuntimeScope();

        expect(() =>
            getExportUtilsRuntime({
                ...scope,
                getAbortController: undefined,
            })
        ).toThrow("exportUtils requires AbortController provider");
        expect(() =>
            getExportUtilsRuntime({
                ...scope,
                getConfirmDangerousAction: undefined,
            })
        ).toThrow("exportUtils requires confirmDangerousAction provider");
        expect(() =>
            getExportUtilsRuntime({
                ...scope,
                getDocument: undefined,
            })
        ).toThrow("exportUtils requires document provider");
        expect(() =>
            getExportUtilsRuntime({
                ...scope,
                getDocumentEventTarget: undefined,
            })
        ).toThrow("exportUtils requires documentEventTarget provider");
        expect(() =>
            getExportUtilsRuntime({
                ...scope,
                getHTMLElement: undefined,
            })
        ).toThrow("exportUtils requires HTMLElement provider");
        expect(() =>
            getExportUtilsRuntime({
                ...scope,
                getOpenPrintWindow: undefined,
            })
        ).toThrow("exportUtils requires openPrintWindow provider");
        expect(() =>
            getExportUtilsRuntime({
                ...scope,
                getProcessEnvironmentValue: undefined,
            })
        ).toThrow("exportUtils requires processEnvironmentValue provider");
        expect(() =>
            getExportUtilsRuntime({
                ...scope,
                getSecureRandomCrypto: undefined,
            })
        ).toThrow("exportUtils requires secureRandomCrypto provider");
        expect(() =>
            getExportUtilsRuntime({
                ...scope,
                getStorage: undefined,
            })
        ).toThrow("exportUtils requires storage provider");
    });

    it("resolves default storage and crypto providers when runtime operations run", () => {
        expect.assertions(2);

        const storage = {
            getItem: vi.fn<Storage["getItem"]>(),
            removeItem: vi.fn<Storage["removeItem"]>(),
            setItem: vi.fn<Storage["setItem"]>(),
        };
        const crypto = {
            getRandomValues: vi.fn<Crypto["getRandomValues"]>(),
        };
        vi.stubGlobal("localStorage", storage);
        vi.stubGlobal("crypto", crypto);

        const runtime = getExportUtilsRuntime();

        expect(runtime.getStorage()).toBe(storage);
        expect(runtime.getSecureRandomScope()).toStrictEqual({ crypto });
    });
});
