import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";

type StateSetter = (path: string, value: unknown, metadata?: unknown) => void;
type StateGetter = (path: string) => unknown;
type StateSubscriber = (
    path: string,
    callback: (value: unknown) => void
) => () => void;
type ActiveTabCallback = (value: string) => void;
type QuerySelectorAll = Document["querySelectorAll"];

type StateManagerMocks = {
    getState: ReturnType<typeof vi.fn<StateGetter>>;
    setState: ReturnType<typeof vi.fn<StateSetter>>;
    subscribe: ReturnType<typeof vi.fn<StateSubscriber>>;
};

describe("updateActiveTab defensive DOM handling", () => {
    let mockWindow: Window;
    let mockDocument: Document;
    let stateManagerMocks: StateManagerMocks;

    beforeEach(() => {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
        mockWindow = dom.window as unknown as Window;
        mockDocument = dom.window.document;

        vi.stubGlobal("window", mockWindow);
        vi.stubGlobal("document", mockDocument);

        // Mock stateManager to capture the subscribe callback
        stateManagerMocks = {
            getState: vi.fn<StateGetter>(() => "summary"),
            setState: vi.fn<StateSetter>(),
            subscribe: vi.fn<StateSubscriber>(),
        };

        vi.doMock(
            import("../../../electron-app/utils/state/core/stateManager.js"),
            () => ({
                getState: stateManagerMocks.getState,
                setState: stateManagerMocks.setState,
                subscribe: stateManagerMocks.subscribe,
            })
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        vi.resetModules();
    });

    async function initializeActiveTabState(): Promise<void> {
        const updateActiveTabModule =
            await import("../../../electron-app/utils/ui/tabs/updateActiveTab.js");

        updateActiveTabModule.initializeActiveTabState();
    }

    function getActiveTabSubscription(): ActiveTabCallback {
        const subscriptionCall = stateManagerMocks.subscribe.mock.calls.find(
            ([path]) => path === "ui.activeTab"
        );

        if (!subscriptionCall) {
            throw new Error(
                "Expected ui.activeTab subscription to be registered"
            );
        }

        const [, callback] = subscriptionCall;

        if (typeof callback !== "function") {
            throw new TypeError("Expected ui.activeTab subscription callback");
        }

        return callback as ActiveTabCallback;
    }

    function mockTabButtons(
        buttons: Array<unknown>
    ): ReturnType<typeof vi.spyOn<QuerySelectorAll>> {
        return vi
            .spyOn(mockDocument, "querySelectorAll")
            .mockReturnValue(buttons as unknown as NodeListOf<Element>);
    }

    describe("state subscription callback", () => {
        it("warns for missing or malformed tab buttons", async () => {
            expect.hasAssertions();

            // Mock console.warn to capture warnings
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            // Initialize the state management to set up subscriptions
            await initializeActiveTabState();

            // Get the subscription callback that was registered
            expect(stateManagerMocks.subscribe).toHaveBeenCalledWith(
                "ui.activeTab",
                expect.any(Function)
            );
            const stateCallback = getActiveTabSubscription();

            // Clear DOM to ensure no tab buttons exist
            mockDocument.body.innerHTML = "";

            // Trigger the state callback
            stateCallback("summary");

            // Should warn about no tab buttons found
            expect(warnSpy).toHaveBeenCalledWith(
                "updateTabButtonsFromState: No tab buttons found in DOM."
            );
            expect(mockDocument.body.innerHTML).toBe("");

            // Create a malformed element that will trigger the defensive check
            const mockButton = {
                id: "tab-summary",
                // Missing classList property to trigger the defensive check
            };

            // Mock querySelectorAll to return our malformed element
            const querySelectorAllSpy = mockTabButtons([mockButton]);

            // Trigger the state callback again
            stateCallback("summary");

            // Should warn about invalid button element
            expect(warnSpy).toHaveBeenCalledWith(
                "updateTabButtonsFromState: Invalid button element found:",
                mockButton
            );
            expect(
                mockDocument.querySelector(".tab-button.active")
            ).not.toBeInstanceOf(mockWindow.HTMLElement);

            // Restore original querySelectorAll
            querySelectorAllSpy.mockRestore();

            warnSpy.mockRestore();
        });

        it("handles null button elements in state callback", async () => {
            expect.hasAssertions();

            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            // Initialize the state management
            await initializeActiveTabState();

            // Get the subscription callback
            const stateCallback = getActiveTabSubscription();

            // Mock querySelectorAll to return an array with null elements
            const querySelectorAllSpy = mockTabButtons([null, undefined]);

            // Trigger the state callback
            stateCallback("summary");

            // Should warn about invalid button elements
            expect(warnSpy).toHaveBeenCalledWith(
                "updateTabButtonsFromState: Invalid button element found:",
                null
            );
            expect(warnSpy).toHaveBeenCalledWith(
                "updateTabButtonsFromState: Invalid button element found:",
                undefined
            );
            expect(
                mockDocument.querySelector(".tab-button.active")
            ).not.toBeInstanceOf(mockWindow.HTMLElement);

            // Restore original querySelectorAll
            querySelectorAllSpy.mockRestore();

            warnSpy.mockRestore();
        });

        it("handles buttons without classList property in state callback", async () => {
            expect.hasAssertions();

            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            // Initialize the state management
            await initializeActiveTabState();

            // Get the subscription callback
            const stateCallback = getActiveTabSubscription();

            // Create a button-like object without classList
            const buttonWithoutClassList = {
                id: "tab-chart",
                // classList is undefined/missing
            };

            // Mock querySelectorAll to return this malformed button
            const querySelectorAllSpy = mockTabButtons([
                buttonWithoutClassList,
            ]);

            // Trigger the state callback
            stateCallback("chart");

            // Should warn about invalid button element
            expect(warnSpy).toHaveBeenCalledWith(
                "updateTabButtonsFromState: Invalid button element found:",
                buttonWithoutClassList
            );
            expect(
                mockDocument.querySelector(".tab-button.active")
            ).not.toBeInstanceOf(mockWindow.HTMLElement);

            // Restore original querySelectorAll
            querySelectorAllSpy.mockRestore();

            warnSpy.mockRestore();
        });
    });
});
