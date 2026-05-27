/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearTabButtonCache,
    setupTabButton,
} from "../../../utils/ui/tabs/setupTabButton.js";

type SetupTabButtonWithCache = typeof setupTabButton & {
    cache?: Map<string, HTMLElement>;
};

type TabButtonElement = HTMLButtonElement & {
    _setupTabButtonCleanup?: () => void;
};

const setupTabButtonWithCache = setupTabButton as SetupTabButtonWithCache;

describe("setupTabButton", () => {
    let container: HTMLDivElement, warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.append(container);
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        clearTabButtonCache();
    });

    afterEach(() => {
        clearTabButtonCache();
        document.body.replaceChildren();
        warnSpy.mockRestore();
    });

    function appendButton(id: string): TabButtonElement {
        const button = document.createElement("button") as TabButtonElement;
        button.id = id;
        container.append(button);

        return button;
    }

    it("warns and skips setup for invalid button IDs", () => {
        const handler = vi.fn();
        const setupResults = [
            setupTabButton(null, handler),
            setupTabButton("", handler),
            setupTabButton("   ", handler),
        ];

        expect(setupResults).toStrictEqual([
            undefined,
            undefined,
            undefined,
        ]);
        expect(warnSpy).toHaveBeenCalledTimes(3);
        expect(warnSpy).toHaveBeenCalledWith("Invalid button id provided.");
        expect(handler).not.toHaveBeenCalled();
    });

    it("warns and skips setup for non-function handlers", () => {
        appendButton("tab-summary");

        expect(setupTabButton("tab-summary", null)).toBeUndefined();
        expect(setupTabButton("tab-summary", "handler")).toBeUndefined();

        expect(warnSpy).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenCalledWith(
            "Invalid handler provided. It must be a function."
        );
    });

    it("warns when the requested button does not exist", () => {
        const handler = vi.fn();

        expect(setupTabButton("missing-tab", handler)).toBeUndefined();

        expect(warnSpy).toHaveBeenCalledWith(
            'Button with id "missing-tab" not found. Ensure the element exists in the DOM.'
        );
        expect(handler).not.toHaveBeenCalled();
    });

    it("attaches one click handler and returns a cleanup function", () => {
        const button = appendButton("tab-chart"),
            handler = vi.fn();

        const cleanup = setupTabButton("tab-chart", handler);
        button.click();
        cleanup?.();
        button.click();

        expect(cleanup).toBeTypeOf("function");
        expect(handler).toHaveBeenCalledTimes(1);
        expect(button._setupTabButtonCleanup).toBe(cleanup);
    });

    it("replaces an existing handler for the same button", () => {
        const button = appendButton("tab-map"),
            firstHandler = vi.fn(),
            secondHandler = vi.fn();

        setupTabButton("tab-map", firstHandler);
        setupTabButton("tab-map", secondHandler);
        button.click();

        expect(firstHandler).not.toHaveBeenCalled();
        expect(secondHandler).toHaveBeenCalledOnce();
        expect(button._setupTabButtonCleanup).toBeTypeOf("function");
    });

    it("caches button lookups while the cached element stays connected", () => {
        const button = appendButton("tab-data"),
            firstHandler = vi.fn(),
            secondHandler = vi.fn();

        setupTabButton("tab-data", firstHandler);
        const getElementByIdSpy = vi.spyOn(document, "getElementById");
        setupTabButton("tab-data", secondHandler);

        expect(getElementByIdSpy).not.toHaveBeenCalled();
        expect(setupTabButtonWithCache.cache?.get("tab-data")).toBe(button);
    });

    it("refreshes stale cached buttons when a DOM replacement exists", () => {
        const oldButton = appendButton("tab-replaced"),
            firstHandler = vi.fn(),
            secondHandler = vi.fn();

        setupTabButton("tab-replaced", firstHandler);
        oldButton.remove();
        const newButton = appendButton("tab-replaced");
        setupTabButton("tab-replaced", secondHandler);
        newButton.click();

        expect(warnSpy).toHaveBeenCalledWith(
            'Cached button with id "tab-replaced" is no longer in DOM. Refreshing cache.'
        );
        expect(firstHandler).not.toHaveBeenCalled();
        expect(secondHandler).toHaveBeenCalledOnce();
        expect(setupTabButtonWithCache.cache?.get("tab-replaced")).toBe(
            newButton
        );
    });

    it("removes stale cache entries when a DOM replacement is missing", () => {
        const button = appendButton("tab-removed");

        setupTabButton("tab-removed", vi.fn());
        button.remove();

        expect(setupTabButton("tab-removed", vi.fn())).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(
            'Button with id "tab-removed" not found after cache refresh.'
        );
        expect(setupTabButtonWithCache.cache?.has("tab-removed")).toBe(false);
    });

    it("clears cached handlers and prevents later clicks from firing", () => {
        const firstButton = appendButton("tab-one"),
            secondButton = appendButton("tab-two"),
            handler = vi.fn();

        setupTabButton("tab-one", handler);
        setupTabButton("tab-two", handler);
        clearTabButtonCache();

        firstButton.click();
        secondButton.click();

        expect(handler).not.toHaveBeenCalled();
        expect(firstButton._setupTabButtonCleanup).toBeUndefined();
        expect(secondButton._setupTabButtonCleanup).toBeUndefined();
        expect(setupTabButtonWithCache.cache?.size ?? 0).toBe(0);
    });

    it("does nothing when clearing before cache initialization", () => {
        setupTabButtonWithCache.cache = undefined;

        expect(clearTabButtonCache()).toBeUndefined();

        expect(setupTabButtonWithCache.cache).toBeUndefined();
    });
});
