// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearTabButtonCache,
    setupTabButton,
} from "../../../electron-app/utils/ui/tabs/setupTabButton.js";

type SetupTabButtonWithCache = typeof setupTabButton & {
    cache?: Map<string, HTMLElement>;
};

type TabButtonElement = HTMLButtonElement & {
    _setupTabButtonCleanup?: () => void;
};

type ClickHandler = () => void;

const setupTabButtonWithCache = setupTabButton as SetupTabButtonWithCache;

function getRequiredButtonCache(): Map<string, HTMLElement> {
    const { cache } = setupTabButtonWithCache;

    if (!cache) {
        throw new Error("Expected tab button cache to be initialized");
    }

    return cache;
}

function setupTabButtonForTest(
    id: unknown,
    handler: unknown,
    documentRef: Document = document
): ReturnType<typeof setupTabButton> {
    return setupTabButton(id, handler, { documentRef });
}

describe(setupTabButton, () => {
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
        expect.assertions(4);

        const handler = vi.fn<ClickHandler>();

        expect([
            setupTabButtonForTest(null, handler),
            setupTabButtonForTest("", handler),
            setupTabButtonForTest("   ", handler),
        ]).toStrictEqual([
            undefined,
            undefined,
            undefined,
        ]);
        expect(warnSpy).toHaveBeenCalledTimes(3);
        expect(warnSpy).toHaveBeenCalledWith("Invalid button id provided.");
        expect(handler).not.toHaveBeenCalled();
    });

    it("warns and skips setup for non-function handlers", () => {
        expect.assertions(3);

        appendButton("tab-summary");

        expect([
            setupTabButtonForTest("tab-summary", null),
            setupTabButtonForTest("tab-summary", "handler"),
        ]).toStrictEqual([undefined, undefined]);

        expect(warnSpy).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenCalledWith(
            "Invalid handler provided. It must be a function."
        );
    });

    it("warns when the requested button does not exist", () => {
        expect.assertions(3);

        const handler = vi.fn<ClickHandler>();

        expect(setupTabButtonForTest("missing-tab", handler)).toBeUndefined();

        expect(warnSpy).toHaveBeenCalledWith(
            'Button with id "missing-tab" not found. Ensure the element exists in the DOM.'
        );
        expect(handler).not.toHaveBeenCalled();
    });

    it("attaches one click handler and returns a cleanup function", () => {
        expect.assertions(3);

        const button = appendButton("tab-chart"),
            handler = vi.fn<ClickHandler>();

        const cleanup = setupTabButtonForTest("tab-chart", handler);
        button.click();
        cleanup?.();
        button.click();

        expect(cleanup).toBeTypeOf("function");
        expect(handler).toHaveBeenCalledOnce();
        expect(button._setupTabButtonCleanup).toBe(cleanup);
    });

    it("replaces an existing handler for the same button", () => {
        expect.assertions(3);

        const button = appendButton("tab-map"),
            firstHandler = vi.fn<ClickHandler>(),
            secondHandler = vi.fn<ClickHandler>();

        setupTabButtonForTest("tab-map", firstHandler);
        setupTabButtonForTest("tab-map", secondHandler);
        button.click();

        expect(firstHandler).not.toHaveBeenCalled();
        expect(secondHandler).toHaveBeenCalledOnce();
        expect(button._setupTabButtonCleanup).toBeTypeOf("function");
    });

    it("caches button lookups while the cached element stays connected", () => {
        expect.assertions(2);

        const button = appendButton("tab-data"),
            firstHandler = vi.fn<ClickHandler>(),
            secondHandler = vi.fn<ClickHandler>();

        setupTabButtonForTest("tab-data", firstHandler);
        const getElementByIdSpy = vi.spyOn(document, "getElementById");
        setupTabButtonForTest("tab-data", secondHandler);

        expect(getElementByIdSpy).not.toHaveBeenCalled();
        expect(getRequiredButtonCache().get("tab-data")).toBe(button);
    });

    it("refreshes stale cached buttons when a DOM replacement exists", () => {
        expect.assertions(4);

        const oldButton = appendButton("tab-replaced"),
            firstHandler = vi.fn<ClickHandler>(),
            secondHandler = vi.fn<ClickHandler>();

        setupTabButtonForTest("tab-replaced", firstHandler);
        oldButton.remove();
        const newButton = appendButton("tab-replaced");
        setupTabButtonForTest("tab-replaced", secondHandler);
        newButton.click();

        expect(warnSpy).toHaveBeenCalledWith(
            'Cached button with id "tab-replaced" is no longer in DOM. Refreshing cache.'
        );
        expect(firstHandler).not.toHaveBeenCalled();
        expect(secondHandler).toHaveBeenCalledOnce();
        expect(getRequiredButtonCache().get("tab-replaced")).toBe(newButton);
    });

    it("removes stale cache entries when a DOM replacement is missing", () => {
        expect.assertions(3);

        const button = appendButton("tab-removed");

        setupTabButtonForTest("tab-removed", vi.fn<ClickHandler>());
        button.remove();

        expect(
            setupTabButtonForTest("tab-removed", vi.fn<ClickHandler>())
        ).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(
            'Button with id "tab-removed" not found after cache refresh.'
        );
        expect({
            cachedButtonIds: [...(setupTabButtonWithCache.cache?.keys() ?? [])],
        }).toEqual({
            cachedButtonIds: [],
        });
    });

    it("clears cached handlers and prevents later clicks from firing", () => {
        expect.assertions(4);

        const firstButton = appendButton("tab-one"),
            secondButton = appendButton("tab-two"),
            handler = vi.fn<ClickHandler>();

        setupTabButtonForTest("tab-one", handler);
        setupTabButtonForTest("tab-two", handler);
        clearTabButtonCache();

        firstButton.click();
        secondButton.click();

        expect(handler).not.toHaveBeenCalled();
        expect(firstButton).not.toHaveProperty("_setupTabButtonCleanup");
        expect(secondButton).not.toHaveProperty("_setupTabButtonCleanup");
        expect([
            ...(setupTabButtonWithCache.cache?.keys() ?? []),
        ]).toStrictEqual([]);
    });

    it("does nothing when clearing before cache initialization", () => {
        expect.assertions(2);

        setupTabButtonWithCache.cache = undefined;

        expect(clearTabButtonCache()).toBeUndefined();

        expect(setupTabButtonWithCache).toHaveProperty("cache", undefined);
    });

    it("looks up buttons from the injected document", () => {
        expect.assertions(3);

        const injectedDocument =
            document.implementation.createHTMLDocument("tab buttons");
        const button = injectedDocument.createElement(
            "button"
        ) as TabButtonElement;
        const handler = vi.fn<ClickHandler>();
        button.id = "tab-isolated";
        injectedDocument.body.append(button);

        const cleanup = setupTabButtonForTest(
            "tab-isolated",
            handler,
            injectedDocument
        );
        button.click();

        expect(cleanup).toBeTypeOf("function");
        expect(handler).toHaveBeenCalledOnce();
        expect(getRequiredButtonCache().get("tab-isolated")).toBe(button);
    });
});
