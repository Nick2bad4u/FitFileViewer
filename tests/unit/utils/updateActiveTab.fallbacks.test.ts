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

// Utility to cleanly reset modules between environment permutations
const resetAll = async () => {
    vi.clearAllMocks();
    vi.doUnmock(
        "../../../electron-app/utils/state/domain/rendererStateManagerAccess.js"
    );
    vi.doUnmock(
        "../../../electron-app/utils/ui/tabs/updateActiveTabRuntime.js"
    );
    vi.resetModules();
};

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

function mockRendererStateAccess({
    getState,
    setState,
    subscribe,
}: {
    getState: GetState;
    setState: SetState;
    subscribe: Subscribe;
}): void {
    vi.doMock(
        import("../../../electron-app/utils/state/domain/rendererStateManagerAccess.js"),
        () => ({
            getRendererCoreStateManager: vi.fn(() => ({
                getState,
                setState,
                subscribe,
            })),
            getRendererCoreSubscribeSingleton: vi.fn(() => undefined),
            getRequiredRendererCoreStateManager: vi.fn(() => ({
                getState,
                setState,
                subscribe,
            })),
        })
    );
}

function mockActiveTabRuntime(documentRef: Document | undefined): void {
    vi.doMock(
        import("../../../electron-app/utils/ui/tabs/updateActiveTabRuntime.js"),
        () => ({
            getUpdateActiveTabRuntime: vi.fn(() => ({
                getDocument: () => documentRef,
                isKeyboardEvent: (value: unknown): value is KeyboardEvent =>
                    value instanceof KeyboardEvent,
            })),
        })
    );
}

describe("updateActiveTab.js - environment fallbacks", () => {
    beforeEach(async () => {
        await resetAll();
    });

    afterEach(async () => {
        await resetAll();
    });

    it("uses typed renderer state-manager access", async () => {
        expect.assertions(3);

        document.body.replaceChildren();
        appendTabButton({ id: "tab-summary", label: "Summary" });

        const effSetState = vi.fn<SetState>();
        const effGetState = vi.fn<GetState>().mockReturnValue("summary");
        const effSubscribe = vi.fn<Subscribe>();
        mockRendererStateAccess({
            getState: effGetState,
            setState: effSetState,
            subscribe: effSubscribe,
        });

        const { updateActiveTab } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");

        const ok = updateActiveTab("tab-summary");

        expect(ok).toStrictEqual(true);
        expect(effSetState).toHaveBeenCalledWith("ui.activeTab", "summary", {
            source: "updateActiveTab",
        });
        expect(effSubscribe).not.toHaveBeenCalled();
    });

    it("uses the active-tab runtime document provider", async () => {
        expect.assertions(3);

        const effDom = new JSDOM(
            '<!doctype html><html><body><button id="tab-chart" class="tab-button">Chart</button></body></html>'
        );
        mockActiveTabRuntime(effDom.window.document);

        const setState = vi.fn<SetState>();
        const getState = vi.fn<GetState>().mockReturnValue("chart");
        const subscribe = vi.fn<Subscribe>();
        mockRendererStateAccess({ getState, setState, subscribe });

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

    it("does not use an ambient document fallback when document is undefined", async () => {
        expect.assertions(3);

        document.body.replaceChildren();
        appendTabButton({ id: "tab-win", label: "Win" });
        const fallbackDocument = document;

        mockActiveTabRuntime(undefined);

        const setState = vi.fn<SetState>();
        const getState = vi.fn<GetState>().mockReturnValue("win");
        const subscribe = vi.fn<Subscribe>();
        mockRendererStateAccess({ getState, setState, subscribe });

        const { updateActiveTab } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const ok = updateActiveTab("tab-win");

        expect(ok).toStrictEqual(false);
        expect(setState).not.toHaveBeenCalled();
        const el = getRequiredElement(fallbackDocument, "tab-win");
        expect(getTabButtonState(el.ownerDocument, "tab-win")).toEqual({
            ariaDisabled: null,
            ariaSelected: null,
            classes: ["tab-button"],
            id: "tab-win",
        });
        errorSpy.mockRestore();
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
        mockRendererStateAccess({ getState, setState, subscribe });

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
        mockRendererStateAccess({ getState, setState, subscribe });

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
