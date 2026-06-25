// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { getFileBrowserTabRuntime } from "../../../../../electron-app/utils/ui/browser/fileBrowserTabRuntime.js";

describe("getFileBrowserTabRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getFileBrowserTabRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getFileBrowserTabRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("routes DOM helpers through the injected document", () => {
        expect.assertions(14);

        const documentRef = document.implementation.createHTMLDocument();
        const dateNow = vi.fn(() => 123_456);
        const runtime = getFileBrowserTabRuntime({
            getDateNow: () => dateNow,
            getDocument: () => documentRef,
            getHTMLElement: () => HTMLElement,
            getHTMLInputElement: () => HTMLInputElement,
            getHTMLSelectElement: () => HTMLSelectElement,
        });
        const container = runtime.createElement("div");
        container.id = "content_browser";
        const status = runtime.createElement("div");
        status.id = "fit-browser-status";
        const text = runtime.createTextNode("Status");
        const input = runtime.createElement("input");
        const select = runtime.createElement("select");
        container.append(status, text, input, select);
        documentRef.body.append(container);

        expect(container.ownerDocument).toBe(documentRef);
        expect(status.ownerDocument).toBe(documentRef);
        expect(text.ownerDocument).toBe(documentRef);
        expect(runtime.getElementById("content_browser")).toBe(container);
        expect(runtime.getElement("#fit-browser-status")).toBe(status);
        expect(runtime.isHTMLElement(status)).toBe(true);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLInputElement(select)).toBe(false);
        expect(runtime.isHTMLSelectElement(select)).toBe(true);
        expect(runtime.isHTMLSelectElement(input)).toBe(false);
        expect(runtime.getElement("#missing")).toBeNull();
        expect(runtime.dateNow()).toBe(123_456);
        expect(dateNow).toHaveBeenCalledOnce();
        expect(document.getElementById("content_browser")).toBeNull();
    });

    it("fails clearly when explicit runtime dependencies are unavailable", () => {
        expect.assertions(8);

        const runtime = getFileBrowserTabRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "fileBrowserTab requires an AbortController runtime"
        );
        expect(() => runtime.dateNow()).toThrow(
            "fileBrowserTab requires a date clock runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.createTextNode("text")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.getElement("#content_browser")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "fileBrowserTab requires an HTMLElement runtime"
        );
        expect(() => runtime.isHTMLInputElement(document.body)).toThrow(
            "fileBrowserTab requires an HTMLInputElement runtime"
        );
        expect(() => runtime.isHTMLSelectElement(document.body)).toThrow(
            "fileBrowserTab requires an HTMLSelectElement runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(10);

        const AbortControllerConstructor = vi.fn();
        const dateNow = vi.fn(() => 123_456);
        const runtime = getFileBrowserTabRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            dateNow,
            document,
            HTMLElement,
            HTMLInputElement,
            HTMLSelectElement,
        } as unknown as Parameters<typeof getFileBrowserTabRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "fileBrowserTab requires an AbortController runtime"
        );
        expect(() => runtime.dateNow()).toThrow(
            "fileBrowserTab requires a date clock runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.createTextNode("text")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.getElementById("content_browser")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "fileBrowserTab requires an HTMLElement runtime"
        );
        expect(() => runtime.isHTMLInputElement(document.body)).toThrow(
            "fileBrowserTab requires an HTMLInputElement runtime"
        );
        expect(() => runtime.isHTMLSelectElement(document.body)).toThrow(
            "fileBrowserTab requires an HTMLSelectElement runtime"
        );
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(dateNow).not.toHaveBeenCalled();
    });
});
