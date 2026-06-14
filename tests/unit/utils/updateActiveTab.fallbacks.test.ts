// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

type StateSetOptions = {
    source: string;
};
type GetState = (path?: string) => unknown;
type SetState = (
    path: string,
    value: unknown,
    options?: StateSetOptions
) => void;
type Subscribe = (
    path: string,
    callback: (newValue: unknown, oldValue?: unknown, path?: string) => void
) => unknown;

type SubscriptionCall = Parameters<Subscribe>;

type TabButtonState = {
    ariaDisabled: null | string;
    ariaSelected: null | string;
    classes: string[];
    id: string;
};
type TestGlobalProperty = "document" | "window";

const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();

// Utility to cleanly reset modules between environment permutations
const resetAll = async () => {
    vi.clearAllMocks();
    vi.resetModules();
};

function setTestGlobal(name: TestGlobalProperty, value: unknown): void {
    if (!originalGlobalDescriptors.has(name)) {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
        if (!descriptor) {
            throw new Error(`Expected globalThis.${name} to exist`);
        }
        originalGlobalDescriptors.set(name, descriptor);
    }

    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreTestGlobals(): void {
    for (const [name, descriptor] of [
        ...originalGlobalDescriptors.entries(),
    ].reverse()) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

async function setTabTestEnvironment(
    environment: Parameters<
        typeof import("../../../electron-app/utils/ui/tabs/tabTestEnvironment.js").setTabTestEnvironmentForTests
    >[0]
): Promise<void> {
    const { setTabTestEnvironmentForTests } =
        await import("../../../electron-app/utils/ui/tabs/tabTestEnvironment.js");
    setTabTestEnvironmentForTests(environment);
}

function getRequiredSubscriptionCall(
    calls: SubscriptionCall[],
    path: string
): SubscriptionCall {
    const call = calls.find(([subscribedPath]) => subscribedPath === path);

    if (!call) {
        throw new Error(`Expected subscription for ${path}`);
    }

    return call;
}

function appendTabButton({
    ariaDisabled,
    ariaSelected,
    id,
    label,
}: {
    ariaDisabled?: string;
    ariaSelected?: string;
    id: string;
    label: string;
}): HTMLButtonElement {
    const button = document.createElement("button");
    button.id = id;
    button.className = "tab-button";
    button.textContent = label;
    if (ariaDisabled !== undefined) {
        button.setAttribute("aria-disabled", ariaDisabled);
    }
    if (ariaSelected !== undefined) {
        button.setAttribute("aria-selected", ariaSelected);
    }
    document.body.append(button);
    return button;
}

function getRequiredElement(ownerDocument: Document, id: string): Element {
    const element = ownerDocument.getElementById(id);
    const ElementConstructor = ownerDocument.defaultView?.Element ?? Element;

    if (!(element instanceof ElementConstructor)) {
        throw new TypeError(`Expected #${id} to exist in the test DOM`);
    }

    return element;
}

function getTabButtonState(
    ownerDocument: Document,
    id: string
): TabButtonState {
    const element = getRequiredElement(ownerDocument, id);

    return {
        ariaDisabled: element.getAttribute("aria-disabled"),
        ariaSelected: element.getAttribute("aria-selected"),
        classes: [...element.classList],
        id: element.id,
    };
}

function getFallbackWindowDocument(): Document {
    const fallbackWindow = Reflect.get(globalThis, "window") as
        | Pick<Window, "document">
        | undefined;

    if (!fallbackWindow?.document) {
        throw new Error("Expected global window document fallback");
    }

    return fallbackWindow.document;
}

describe("updateActiveTab.js - environment fallbacks", () => {
    beforeEach(async () => {
        await resetAll();
    });

    afterEach(async () => {
        await setTabTestEnvironment(null);
        restoreTestGlobals();
        await resetAll();
    });

    it("uses the tab test state manager when module functions are unavailable", async () => {
        expect.assertions(3);

        // Arrange a normal JSDOM document for DOM operations
        document.body.replaceChildren();
        appendTabButton({ id: "tab-summary", label: "Summary" });

        // Provide an effective state manager override with distinct spies.
        const effSetState = vi.fn<SetState>();
        const effGetState = vi.fn<GetState>().mockReturnValue("summary");
        const effSubscribe = vi.fn<Subscribe>();
        await setTabTestEnvironment({
            stateManager: {
                setState: effSetState,
                getState: effGetState,
                subscribe: effSubscribe,
            },
        });

        // Mock the module path used within updateActiveTab.js to export no functions,
        // forcing getStateMgr() to pick up the tab test state manager.
        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({})
        );

        const { updateActiveTab } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");

        // Act
        const ok = updateActiveTab("tab-summary");

        // Assert
        expect(ok).toStrictEqual(true);
        expect(effSetState).toHaveBeenCalledWith("ui.activeTab", "summary", {
            source: "updateActiveTab",
        });
        expect(effSubscribe).not.toHaveBeenCalled();
    });

    it("falls back to the tab test document when document/window are unavailable/invalid", async () => {
        expect.assertions(3);

        // Create a separate JSDOM to act as the effective document
        const effDom = new JSDOM(
            '<!doctype html><html><body><button id="tab-chart" class="tab-button">Chart</button></body></html>'
        );
        await setTabTestEnvironment({ document: effDom.window.document });

        // Invalidate the standard globals so getDoc() prefers the effective document
        // Note: typeof checks in getDoc guard these assignments.
        setTestGlobal("document", undefined);
        setTestGlobal("window", undefined);

        // Provide a minimal viable state manager to satisfy calls
        const setState = vi.fn<SetState>();
        const getState = vi.fn<GetState>().mockReturnValue("chart");
        const subscribe = vi.fn<Subscribe>();
        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({
                setState,
                getState,
                subscribe,
            })
        );

        const { updateActiveTab } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");

        const ok = updateActiveTab("tab-chart");

        expect(ok).toStrictEqual(true);
        expect(setState).toHaveBeenCalledWith("ui.activeTab", "chart", {
            source: "updateActiveTab",
        });
        expect(getTabButtonState(effDom.window.document, "tab-chart")).toEqual({
            ariaDisabled: null,
            ariaSelected: null,
            classes: ["tab-button", "active"],
            id: "tab-chart",
        });
    });

    it("uses window.document when document is undefined (window fallback)", async () => {
        expect.assertions(3);

        // Prepare a fresh JSDOM to simulate window.document while document is undefined
        const dom = new JSDOM(
            '<!doctype html><html><body><button id="tab-win" class="tab-button">Win</button></body></html>'
        );

        // Invalidate document; provide window.document only
        setTestGlobal("document", undefined);
        setTestGlobal("window", { document: dom.window.document });

        const setState = vi.fn<SetState>();
        const getState = vi.fn<GetState>().mockReturnValue("win");
        const subscribe = vi.fn<Subscribe>();
        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({
                setState,
                getState,
                subscribe,
            })
        );

        const { updateActiveTab } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");
        const ok = updateActiveTab("tab-win");

        expect(ok).toStrictEqual(true);
        expect(setState).toHaveBeenCalledWith("ui.activeTab", "win", {
            source: "updateActiveTab",
        });
        const el = getRequiredElement(getFallbackWindowDocument(), "tab-win");
        expect(getTabButtonState(el.ownerDocument, "tab-win")).toEqual({
            ariaDisabled: null,
            ariaSelected: null,
            classes: ["tab-button", "active"],
            id: "tab-win",
        });
    });

    it("subscribes and updates aria-selected via state callback (valid path)", async () => {
        expect.assertions(3);

        // Standard DOM with two buttons
        document.body.replaceChildren();
        appendTabButton({
            ariaSelected: "false",
            id: "tab-summary",
            label: "Summary",
        });
        appendTabButton({
            ariaSelected: "false",
            id: "tab-data",
            label: "Data",
        });

        const setState = vi.fn<SetState>();
        const getState = vi.fn<GetState>().mockReturnValue("summary");
        const subscribe = vi.fn<Subscribe>();
        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({
                setState,
                getState,
                subscribe,
            })
        );

        const { initializeActiveTabState } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");

        // Capture subscription
        initializeActiveTabState();
        expect(
            subscribe.mock.calls.map(([path, callback]) => [
                path,
                typeof callback,
            ])
        ).toStrictEqual([["ui.activeTab", "function"]]);
        const requiredCall = getRequiredSubscriptionCall(
            subscribe.mock.calls,
            "ui.activeTab"
        );
        expect(requiredCall[1]).toBeTypeOf("function");
        const cb = requiredCall[1] as (val: string) => void;

        // Act: make "data" active via state
        cb("data");

        // Assert: aria-selected and classes reflect state
        const summaryTab = getRequiredElement(document, "tab-summary");
        const dataTab = getRequiredElement(document, "tab-data");

        expect({
            data: getTabButtonState(document, dataTab.id),
            summary: getTabButtonState(document, summaryTab.id),
        }).toStrictEqual({
            data: {
                ariaDisabled: null,
                ariaSelected: "true",
                classes: ["tab-button", "active"],
                id: "tab-data",
            },
            summary: {
                ariaDisabled: null,
                ariaSelected: "false",
                classes: ["tab-button"],
                id: "tab-summary",
            },
        });
    });

    it('ignores clicks on aria-disabled="true" buttons (no disabled/class)', async () => {
        expect.assertions(2);

        document.body.replaceChildren();
        const tabMapButton = appendTabButton({
            ariaDisabled: "true",
            id: "tab-map",
            label: "Map",
        });

        const setState = vi.fn<SetState>();
        const getState = vi.fn<GetState>().mockReturnValue("summary");
        const subscribe = vi.fn<Subscribe>();
        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({
                setState,
                getState,
                subscribe,
            })
        );

        const { initializeActiveTabState } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");
        initializeActiveTabState();

        tabMapButton.click();
        expect(setState).not.toHaveBeenCalled();
        expect(getTabButtonState(document, tabMapButton.id)).toStrictEqual({
            ariaDisabled: "true",
            ariaSelected: null,
            classes: ["tab-button"],
            id: "tab-map",
        });
    });
});
