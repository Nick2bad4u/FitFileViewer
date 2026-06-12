/**
 * Exercises the tab-button state transitions used during app startup and
 * FIT-file load.
 */
/* eslint-disable vitest/no-hooks -- Integration tests share DOM lifecycle setup. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type StateKey =
    | "fitFile.rawData"
    | "ui.activeTab"
    | "ui.tabButtonsEnabled";
type StateShape = {
    "fitFile.rawData": null | { records: { type?: string }[] };
    "ui.activeTab": string;
    "ui.tabButtonsEnabled": boolean;
};

const mockStateManager = {
    getState: vi.fn<(key: StateKey) => StateShape[StateKey]>(),
    setState: vi.fn<(key: StateKey, value: StateShape[StateKey]) => void>(),
    subscribe: vi.fn<
        (key: StateKey, cb: (value: StateShape[StateKey]) => void) => () => void
    >(() => () => {}),
};

let globalState: StateShape = {
    "fitFile.rawData": null,
    "ui.activeTab": "summary",
    "ui.tabButtonsEnabled": false,
};

const TAB_FIXTURES = [
    { active: true, id: "tab-summary", label: "Summary", tabIndex: "0" },
    { active: false, id: "tab-chart", label: "Chart", tabIndex: "-1" },
    { active: false, id: "tab-map", label: "Map", tabIndex: "-1" },
    { active: false, id: "tab-table", label: "Data", tabIndex: "-1" },
] as const;

function createRealAppTabsDom(): void {
    const container = document.createElement("div");
    container.className = "tabs-container";

    for (const tab of TAB_FIXTURES) {
        const button = document.createElement("button");
        button.className = tab.active ? "tab-button active" : "tab-button";
        button.id = tab.id;
        button.role = "tab";
        button.setAttribute("aria-selected", String(tab.active));
        button.tabIndex = Number(tab.tabIndex);
        button.textContent = tab.label;
        container.appendChild(button);
    }

    document.body.replaceChildren(container);
}

async function flushMutationObservers(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

function toHtmlButton(button: Element): HTMLButtonElement {
    if (!(button instanceof HTMLButtonElement)) {
        throw new TypeError(`Expected ${button.id} to be a button.`);
    }

    return button;
}

// Mock implementation
mockStateManager.getState.mockImplementation((key) => globalState[key]);
mockStateManager.setState.mockImplementation((key, value) => {
    globalState[key] = value;
    const callbacks = mockStateManager.subscribe.mock.calls
        .filter((call) => call[0] === key)
        .map((call) => call[1]);
    for (const callback of callbacks) {
        callback(value);
    }
});

vi.mock(
    import("../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: mockStateManager.getState,
        setState: mockStateManager.setState,
        subscribe: mockStateManager.subscribe,
    })
);

vi.mock(import("../../../electron-app/utils/dom/index.js"), () => ({
    isHTMLElement: (el: unknown) => el instanceof HTMLElement,
}));

describe("tab button state integration", () => {
    beforeEach(() => {
        globalState = {
            "fitFile.rawData": null,
            "ui.activeTab": "summary",
            "ui.tabButtonsEnabled": false,
        };

        vi.clearAllMocks();

        createRealAppTabsDom();
    });

    afterEach(() => {
        document.body.replaceChildren();
        vi.clearAllMocks();
    });

    it("enables all tab buttons after FIT data is loaded", async () => {
        expect.assertions(9);

        const { setTabButtonsEnabled, initializeTabButtonState } =
            await import("../../../electron-app/utils/ui/controls/enableTabButtons.js");
        const { initializeActiveTabState } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");

        initializeTabButtonState();
        initializeActiveTabState();

        const buttons = document.querySelectorAll(".tab-button");
        buttons.forEach((button) => {
            const btn = toHtmlButton(button);

            expect({
                disabled: btn.disabled,
                hasDisabledAttribute: btn.hasAttribute("disabled"),
            }).toStrictEqual({
                disabled: true,
                hasDisabledAttribute: true,
            });
        });

        globalState["fitFile.rawData"] = { records: [{ type: "activity" }] };
        mockStateManager.setState(
            "fitFile.rawData",
            globalState["fitFile.rawData"]
        );

        await flushMutationObservers();

        setTabButtonsEnabled(true);

        await flushMutationObservers();

        buttons.forEach((button) => {
            const btn = toHtmlButton(button);

            expect({
                disabled: btn.disabled,
                hasDisabledAttribute: btn.hasAttribute("disabled"),
                pointerEvents: btn.style.pointerEvents,
            }).toStrictEqual({
                disabled: false,
                hasDisabledAttribute: false,
                pointerEvents: "auto",
            });
        });

        expect(
            [...buttons].map((button) => button.hasAttribute("disabled"))
        ).not.toContain(true);
    }, 15000);

    it("does not re-add disabled attributes across repeated enable calls", async () => {
        expect.assertions(2);

        const { setTabButtonsEnabled, initializeTabButtonState } =
            await import("../../../electron-app/utils/ui/controls/enableTabButtons.js");
        const { initializeActiveTabState } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");

        const changes: {
            newValue: null | string;
            oldValue: null | string;
            source: string;
            target: string;
            timestamp: number;
        }[] = [];
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "disabled"
                ) {
                    const target = mutation.target as HTMLElement;
                    changes.push({
                        target: target.id,
                        oldValue: mutation.oldValue,
                        newValue: target.getAttribute("disabled"),
                        timestamp: Date.now(),
                        source: "unknown",
                    });
                }
            });
        });

        const buttons = document.querySelectorAll(".tab-button");
        buttons.forEach((button) => {
            observer.observe(button, {
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ["disabled"],
            });
        });

        initializeTabButtonState();
        initializeActiveTabState();

        await flushMutationObservers();

        globalState["fitFile.rawData"] = { records: [] };
        mockStateManager.setState(
            "fitFile.rawData",
            globalState["fitFile.rawData"]
        );
        setTabButtonsEnabled(true);

        await flushMutationObservers();

        setTabButtonsEnabled(true);

        await flushMutationObservers();

        observer.disconnect();

        const unexpectedDisables = changes.filter(
            (change) => change.newValue === "" && change.oldValue === null
        );

        const buttonStates = [...buttons].map((button) => ({
            disabled: (button as HTMLButtonElement).disabled,
            hasDisabledAttribute: button.hasAttribute("disabled"),
            id: button.id,
        }));

        expect(unexpectedDisables).toStrictEqual([]);
        expect(buttonStates).toStrictEqual([
            {
                disabled: false,
                hasDisabledAttribute: false,
                id: "tab-summary",
            },
            {
                disabled: false,
                hasDisabledAttribute: false,
                id: "tab-chart",
            },
            {
                disabled: false,
                hasDisabledAttribute: false,
                id: "tab-map",
            },
            {
                disabled: false,
                hasDisabledAttribute: false,
                id: "tab-table",
            },
        ]);
    }, 15000);

    it("preserves enabled state after rapid startup toggles", async () => {
        expect.assertions(4);

        const { setTabButtonsEnabled, initializeTabButtonState } =
            await import("../../../electron-app/utils/ui/controls/enableTabButtons.js");
        const { initializeActiveTabState } =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");

        initializeTabButtonState();
        initializeActiveTabState();

        setTabButtonsEnabled(false);
        await flushMutationObservers();

        setTabButtonsEnabled(true);
        await flushMutationObservers();

        setTabButtonsEnabled(false);
        await flushMutationObservers();

        setTabButtonsEnabled(true);
        await flushMutationObservers();

        const buttons = document.querySelectorAll(".tab-button");
        buttons.forEach((button) => {
            const btn = toHtmlButton(button);

            expect({
                disabled: btn.disabled,
                hasDisabledAttribute: btn.hasAttribute("disabled"),
            }).toStrictEqual({
                disabled: false,
                hasDisabledAttribute: false,
            });
        });
    }, 15000);
});
/* eslint-enable vitest/no-hooks */
