// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getExportUtilsRuntime,
    type ExportUtilsRuntimeScope,
} from "../../../../../electron-app/utils/files/export/exportUtilsRuntime.js";

describe("exportUtilsRuntime", () => {
    afterEach(() => {
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
            runtime = getExportUtilsRuntime({
                getConfirmDangerousAction: () => confirmDangerousAction,
            });

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
            getExportUtilsRuntime({}).confirmDangerousAction(
                "Clear saved export tokens?"
            )
        ).toBe(false);
    });

    it("opens print windows through the scoped print-window runtime", () => {
        expect.assertions(2);

        const popup = {} as Window;
        const openPrintWindow = vi.fn(() => popup);
        const runtime = getExportUtilsRuntime({
            getOpenPrintWindow: () => openPrintWindow,
        });

        expect(
            runtime.openPrintWindow("", "_blank", "noopener,noreferrer")
        ).toBe(popup);
        expect(openPrintWindow).toHaveBeenCalledWith(
            "",
            "_blank",
            "noopener,noreferrer"
        );
    });

    it("resolves storage through the scoped storage runtime", () => {
        expect.assertions(1);

        const storage = {
            getItem: vi.fn<Storage["getItem"]>(),
            removeItem: vi.fn<Storage["removeItem"]>(),
            setItem: vi.fn<Storage["setItem"]>(),
        };
        const runtime = getExportUtilsRuntime({
            getStorage: () => storage,
        });

        expect(runtime.getStorage()).toBe(storage);
    });

    it("ignores invalid scoped storage runtimes", () => {
        expect.assertions(1);

        const runtime = getExportUtilsRuntime({
            getStorage: () => ({}) as Storage,
        });

        expect(runtime.getStorage()).toBeNull();
    });

    it("resolves secure randomness through the scoped crypto runtime", () => {
        expect.assertions(1);

        const crypto = {
            getRandomValues: vi.fn<Crypto["getRandomValues"]>(),
        };
        const runtime = getExportUtilsRuntime({
            getSecureRandomCrypto: () => crypto,
        });

        expect(runtime.getSecureRandomScope()).toStrictEqual({ crypto });
    });

    it("ignores invalid scoped secure-random runtimes", () => {
        expect.assertions(1);

        const runtime = getExportUtilsRuntime({
            getSecureRandomCrypto: () => ({}) as Crypto,
        });

        expect(runtime.getSecureRandomScope()).toStrictEqual({});
    });

    it("returns null when print-window opening is unavailable", () => {
        expect.assertions(1);

        expect(
            getExportUtilsRuntime({}).openPrintWindow(
                "",
                "_blank",
                "noopener,noreferrer"
            )
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

        const runtime = getExportUtilsRuntime({
            getAbortController: () =>
                TestAbortController as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(created).toBe(true);
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
        const runtime = getExportUtilsRuntime({
            getDocument: () => documentEventTarget,
            getDocumentEventTarget: () => documentEventTarget,
        });

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
        const runtime = getExportUtilsRuntime({
            getDocument: () => documentRef,
        });

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
        const runtime = getExportUtilsRuntime({
            getDocumentEventTarget: () => documentEventTarget,
        });

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
        const runtime = getExportUtilsRuntime({
            getDocument: () => ({ activeElement }) as unknown as Document,
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.getActiveElement()).toBe(button);

        activeElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        expect(runtime.getActiveElement()).toBeNull();
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(13);

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
        const runtime = getExportUtilsRuntime({
            AbortController,
            confirmDangerousAction,
            crypto,
            documentEventTarget,
            HTMLElement,
            localStorage: storage,
            openPrintWindow,
        } as unknown as ExportUtilsRuntimeScope);

        expect(
            runtime.confirmDangerousAction("Clear saved export tokens?")
        ).toBe(false);
        expect(runtime.openPrintWindow("", "_blank", "noopener")).toBeNull();
        expect(runtime.getStorage()).toBeNull();
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
        expect(crypto.getRandomValues).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
    });

    it("throws when explicit runtime dependencies are unavailable", () => {
        expect.assertions(5);

        expect(() => getExportUtilsRuntime({}).createAbortController()).toThrow(
            "exportUtils requires an AbortController runtime"
        );
        expect(() =>
            getExportUtilsRuntime({}).addDocumentKeydownListener(
                () => undefined,
                {}
            )
        ).toThrow("exportUtils requires a document event-target runtime");
        expect(() =>
            getExportUtilsRuntime({}).appendToBody(document.createElement("a"))
        ).toThrow("exportUtils requires a document runtime");
        expect(() => getExportUtilsRuntime({}).getActiveElement()).toThrow(
            "exportUtils requires a document runtime"
        );
        expect(() =>
            getExportUtilsRuntime({
                getDocument: () => document,
            }).getActiveElement()
        ).toThrow("exportUtils requires an HTMLElement runtime");
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
