/**
 * Exercises the tab-button state transitions used during app startup and
 * FIT-file load.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockStateManager = {
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn((key, cb) => {
        return () => {
            /* noop */
        };
    }),
};

let globalState = {
    "ui.activeTab": "summary",
    "ui.tabButtonsEnabled": false,
    globalData: null,
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

// Mock implementation
mockStateManager.getState.mockImplementation((key) => globalState[key]);
mockStateManager.setState.mockImplementation((key, value) => {
    globalState[key] = value;
    const callbacks = mockStateManager.subscribe.mock.calls
        .filter((call) => call[0] === key)
        .map((call) => call[1]);
    callbacks.forEach((callback) => callback(value));
});

vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: mockStateManager.getState,
    setState: mockStateManager.setState,
    subscribe: mockStateManager.subscribe,
}));

vi.mock("../../../utils/dom/index.js", () => ({
    isHTMLElement: (el) => el instanceof HTMLElement,
}));

describe("Tab button state integration", () => {
    beforeEach(() => {
        globalState = {
            "ui.activeTab": "summary",
            "ui.tabButtonsEnabled": false,
            globalData: null,
        };

        vi.clearAllMocks();

        createRealAppTabsDom();
    });

    afterEach(() => {
        document.body.replaceChildren();
        vi.clearAllMocks();
    });

    it("enables all tab buttons after FIT data is loaded", async () => {
        const { setTabButtonsEnabled, initializeTabButtonState } =
            await import("../../utils/ui/controls/enableTabButtons.js");
        const { initializeActiveTabState } =
            await import("../../utils/ui/tabs/updateActiveTab.js");

        initializeTabButtonState();
        initializeActiveTabState();

        const buttons = document.querySelectorAll(".tab-button");
        buttons.forEach((button) => {
            const btn = /** @type {HTMLButtonElement} */ button;
            expect(btn.disabled).toBe(true);
            expect(btn.hasAttribute("disabled")).toBe(true);
        });

        globalState.globalData = { records: [{ type: "activity" }] };
        mockStateManager.setState("globalData", globalState.globalData);

        await flushMutationObservers();

        if (typeof window !== "undefined") {
            window.setTabButtonsEnabled = setTabButtonsEnabled;
        }
        setTabButtonsEnabled(true);

        await flushMutationObservers();

        buttons.forEach((button) => {
            const btn = /** @type {HTMLButtonElement} */ button;

            expect(btn.disabled).toBe(false);
            expect(btn.hasAttribute("disabled")).toBe(false);
            expect(btn.hasAttribute("disabled")).not.toBe(true);
            expect(btn.style.pointerEvents).toBe("auto");
        });
    }, 15000);

    it("does not re-add disabled attributes across repeated enable calls", async () => {
        const { setTabButtonsEnabled, initializeTabButtonState } =
            await import("../../utils/ui/controls/enableTabButtons.js");
        const { initializeActiveTabState } =
            await import("../../utils/ui/tabs/updateActiveTab.js");

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
                    const target = /** @type {HTMLElement} */ mutation.target;
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

        globalState.globalData = { records: [] };
        mockStateManager.setState("globalData", globalState.globalData);
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
        const { setTabButtonsEnabled, initializeTabButtonState } =
            await import("../../utils/ui/controls/enableTabButtons.js");
        const { initializeActiveTabState } =
            await import("../../utils/ui/tabs/updateActiveTab.js");

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
            const btn = /** @type {HTMLButtonElement} */ button;
            expect(btn.disabled).toBe(false);
            expect(btn.hasAttribute("disabled")).toBe(false);
        });
    }, 15000);
});
