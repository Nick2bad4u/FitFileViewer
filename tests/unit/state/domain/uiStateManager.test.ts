// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AppActionsModule =
    typeof import("../../../../electron-app/utils/app/lifecycle/appActions.js");
type StateManagerModule =
    typeof import("../../../../electron-app/utils/state/core/stateManager.js");
type UiStateManagerModule =
    typeof import("../../../../electron-app/utils/state/domain/uiStateManager.js");
type NotificationModule =
    typeof import("../../../../electron-app/utils/ui/notifications/showNotification.js");
type UIStateManagerInstance = InstanceType<
    UiStateManagerModule["UIStateManager"]
>;

let AppActions: AppActionsModule["AppActions"];
let getState: StateManagerModule["getState"];
let setState: StateManagerModule["setState"];
let showNotification: NotificationModule["showNotification"];
let subscribe: StateManagerModule["subscribe"];
let updateState: StateManagerModule["updateState"];
let UIActions: UiStateManagerModule["UIActions"];
let UIStateManager: UiStateManagerModule["UIStateManager"];
let uiStateManager: UiStateManagerModule["uiStateManager"];

type MockMediaQueryList = Pick<
    MediaQueryList,
    | "addEventListener"
    | "addListener"
    | "matches"
    | "removeEventListener"
    | "removeListener"
>;
type TestGlobalProperty = "matchMedia";

const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();

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
    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

function createMockMediaQueryList(
    overrides: Partial<MockMediaQueryList> = {}
): MockMediaQueryList {
    return {
        addEventListener:
            vi.fn<
                (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: AddEventListenerOptions | boolean
                ) => void
            >(),
        addListener:
            vi.fn<(callback: (event: MediaQueryListEvent) => void) => void>(),
        matches: false,
        removeEventListener:
            vi.fn<
                (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: EventListenerOptions | boolean
                ) => void
            >(),
        removeListener:
            vi.fn<(callback: (event: MediaQueryListEvent) => void) => void>(),
        ...overrides,
    };
}

describe("uiStateManager - comprehensive coverage", () => {
    let addEventListenerSpy: any;

    function createElementWithAttributes(
        tagName: string,
        attributes: Record<string, string> = {},
        textContent = ""
    ) {
        const element = document.createElement(tagName);
        for (const [name, value] of Object.entries(attributes)) {
            element.setAttribute(name, value);
        }
        element.textContent = textContent;
        return element;
    }

    function appendFixtureElement(
        tagName: string,
        attributes: Record<string, string> = {},
        textContent = ""
    ) {
        const element = createElementWithAttributes(
            tagName,
            attributes,
            textContent
        );
        document.body.appendChild(element);
        return element;
    }

    function getRequiredElement(id: string): HTMLElement {
        const element = document.getElementById(id);

        if (!(element instanceof HTMLElement)) {
            throw new Error(`Expected #${id} to exist`);
        }

        return element;
    }

    function removeElementIfPresent(id: string): void {
        const element = document.getElementById(id);

        if (element) {
            element.remove();
        }
    }

    function getRequiredDescendant<T extends Element>(
        parent: Element,
        selector: string,
        constructor: new (...args: any[]) => T
    ): T {
        const element = parent.querySelector(selector);

        if (!(element instanceof constructor)) {
            throw new Error(`Expected descendant ${selector}`);
        }

        return element;
    }

    function getClassState(...ids: string[]) {
        return Object.fromEntries(
            ids.map((id) => {
                const element = document.getElementById(id);
                return [id, element ? [...element.classList] : []];
            })
        );
    }

    function getElementClassList(id: string): string[] {
        return getClassState(id)[id] ?? [];
    }

    function getElementClassState(elements: Record<string, Element | null>) {
        return Object.fromEntries(
            Object.entries(elements).map(([name, element]) => [
                name,
                element ? [...element.classList] : [],
            ])
        );
    }

    function setupFixtureDom() {
        document.body.replaceChildren(
            createElementWithAttributes("div", { id: "main-content" }),
            createElementWithAttributes("div", { id: "sidebar" }),
            createElementWithAttributes("div", { id: "sidebar-toggle" }),
            createElementWithAttributes("div", { id: "loading-indicator" }),
            createElementWithAttributes("div", {
                id: "chartjs-settings-wrapper",
            }),
            createElementWithAttributes("div", {
                id: "chart-controls-toggle",
            }),
            createElementWithAttributes("div", {
                id: "measurement-mode-toggle",
            }),
            createElementWithAttributes("div", { id: "measurement-buttons" }),
            createElementWithAttributes("div", { id: "map-container" }),
            createElementWithAttributes("div", { id: "drop_overlay" }),
            createElementWithAttributes("iframe", { id: "altfit_iframe" }),
            createElementWithAttributes("iframe", { id: "zwift_iframe" }),
            createElementWithAttributes("button", { id: "unload_file_btn" }),
            createElementWithAttributes(
                "button",
                { "data-tab": "charts", id: "tab-button-charts" },
                "Charts"
            ),
            createElementWithAttributes(
                "button",
                { "data-tab": "map", id: "tab-button-map" },
                "Map"
            ),
            createElementWithAttributes(
                "button",
                { "data-tab": "data", id: "tab-button-data" },
                "Data"
            ),
            createElementWithAttributes(
                "button",
                { "data-theme": "light", id: "theme-light" },
                "Light"
            ),
            createElementWithAttributes(
                "button",
                { "data-theme": "dark", id: "theme-dark" },
                "Dark"
            ),
            createElementWithAttributes(
                "button",
                { "data-theme": "system", id: "theme-system" },
                "System"
            ),
            createElementWithAttributes("div", {
                class: "tab-content",
                "data-tab-content": "charts",
            }),
            createElementWithAttributes("div", {
                class: "tab-content",
                "data-tab-content": "map",
            }),
            createElementWithAttributes("div", {
                class: "tab-content",
                "data-tab-content": "data",
            })
        );
    }

    function getRenderedNotificationState() {
        const notification = document.querySelector<HTMLElement>(
            "[data-test-notification]"
        );

        return notification
            ? {
                  duration: notification.dataset.duration,
                  text: notification.textContent,
                  type: notification.dataset.type,
              }
            : null;
    }

    function renderNotificationToDom(
        message: string,
        type = "info",
        duration = 3000
    ) {
        const notification = document.createElement("div");
        notification.dataset.duration = String(duration);
        notification.dataset.testNotification = "true";
        notification.dataset.type = type;
        notification.textContent = message;
        document.body.append(notification);
    }

    function getStableLastNotificationState() {
        const [
            path,
            value,
            options,
        ] = vi.mocked(setState).mock.calls.at(-1) ?? [];
        const notification =
            value && typeof value === "object"
                ? (value as Record<string, unknown>)
                : {};

        return {
            notification: {
                message: notification["message"],
                timestampType: typeof notification["timestamp"],
                type: notification["type"],
            },
            options,
            path,
        };
    }

    function getElementClickListenerRegistration(
        element: Element | null,
        manager: UIStateManagerInstance
    ) {
        expect(element).toBeInstanceOf(Element);
        if (!(element instanceof Element)) {
            throw new Error("Expected element for click listener registration");
        }

        const listenerRegistrations = addEventListenerSpy.mock.calls.flatMap(
            (call: unknown[], index: number) => {
                if (
                    addEventListenerSpy.mock.contexts[index] !== element ||
                    call[0] !== "click"
                ) {
                    return [];
                }

                const [
                    ,
                    listener,
                    options,
                ] = call;

                return [{ listener, options }];
            }
        );
        expect(listenerRegistrations).toHaveLength(1);

        const listenerRegistration = listenerRegistrations[0];
        if (!listenerRegistration) {
            throw new Error("Expected one click listener registration");
        }
        const { listener, options } = listenerRegistration;

        expect(listener).toBeTypeOf("function");
        expect(options).toStrictEqual({
            signal: manager.eventListenerAbortController.signal,
        });

        return { listener, options };
    }

    beforeEach(async () => {
        vi.resetModules();
        vi.doMock(
            import("../../../../electron-app/utils/app/lifecycle/appActions.js"),
            () => ({
                AppActions: {
                    switchTab: vi.fn<(tabName: string) => void>(),
                    switchTheme: vi.fn<(theme: string) => void>(),
                    toggleChartControls: vi.fn<() => void>(),
                    toggleMeasurementMode: vi.fn<() => void>(),
                },
            })
        );
        vi.doMock(
            import("../../../../electron-app/utils/ui/notifications/showNotification.js"),
            () => ({
                showNotification:
                    vi.fn<
                        (
                            message: string,
                            type?: string,
                            duration?: number
                        ) => void
                    >(),
            })
        );
        vi.doMock(
            import("../../../../electron-app/utils/state/core/stateManager.js"),
            () => ({
                getState: vi.fn<(path?: string) => unknown>(),
                setState:
                    vi.fn<
                        (
                            path: string,
                            value: unknown,
                            options?: unknown
                        ) => void
                    >(),
                subscribe: vi.fn<
                    (
                        path: string,
                        callback: (value: unknown) => void
                    ) => () => void
                >(() => () => {}),
                updateState:
                    vi.fn<
                        (
                            path: string,
                            value: unknown,
                            options?: unknown
                        ) => void
                    >(),
            })
        );

        ({ AppActions } =
            await import("../../../../electron-app/utils/app/lifecycle/appActions.js"));
        ({ showNotification } =
            await import("../../../../electron-app/utils/ui/notifications/showNotification.js"));
        ({ getState, setState, subscribe, updateState } =
            await import("../../../../electron-app/utils/state/core/stateManager.js"));
        ({ UIStateManager, uiStateManager, UIActions } =
            await import("../../../../electron-app/utils/state/domain/uiStateManager.js"));

        // Set up DOM elements that UIStateManager expects
        setupFixtureDom();

        // Set up document.documentElement if not available
        if (!document.documentElement) {
            (document as any).documentElement = document.createElement("html");
            document.appendChild(document.documentElement);
        }

        // Mock window properties
        Object.defineProperty(window, "innerHeight", {
            value: 800,
            writable: true,
        });
        Object.defineProperty(window, "innerWidth", {
            value: 1200,
            writable: true,
        });
        Object.defineProperty(window, "outerHeight", {
            value: 850,
            writable: true,
        });
        Object.defineProperty(window, "outerWidth", {
            value: 1250,
            writable: true,
        });
        Object.defineProperty(window, "screenX", {
            value: 100,
            writable: true,
        });
        Object.defineProperty(window, "screenY", {
            value: 200,
            writable: true,
        });

        Object.defineProperty(window, "screen", {
            value: {
                availWidth: 1920,
                availHeight: 1080,
            },
            writable: true,
        });

        // Set up matchMedia mock
        Object.defineProperty(window, "matchMedia", {
            value: vi.fn<(query: string) => MockMediaQueryList>(() =>
                createMockMediaQueryList()
            ),
            writable: true,
            configurable: true,
        });

        // Clear any active classes on theme buttons and reset DOM state
        document.querySelectorAll("[data-theme]").forEach((button) => {
            button.classList.remove("active");
        });

        // Clear any other state classes that might persist
        document.querySelectorAll(".tab-button").forEach((button) => {
            button.classList.remove("active");
        });

        // Reset document.documentElement theme
        if (document.documentElement) {
            delete document.documentElement.dataset.theme;
        }

        // Spy on addEventListener
        addEventListenerSpy = vi.spyOn(Element.prototype, "addEventListener");

        // Reset all mocks
        vi.clearAllMocks();
        vi.mocked(getState).mockReturnValue(false);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        restoreTestGlobals();
    });

    describe("constructor and initialization", () => {
        it("should create UIStateManager with eventListeners Map and initialize", () => {
            expect.assertions(3);

            const manager = new UIStateManager();

            expect(manager).toBeInstanceOf(UIStateManager);
            expect(manager.eventListeners).toBeInstanceOf(Map);
            expect(manager.eventListeners.size).not.toBeLessThan(0);
        });

        it("should call setupEventListeners and initializeReactiveElements during initialization", () => {
            expect.assertions(3);

            const setupSpy = vi.spyOn(
                UIStateManager.prototype,
                "setupEventListeners"
            );
            const initSpy = vi.spyOn(
                UIStateManager.prototype,
                "initializeReactiveElements"
            );

            const manager = new UIStateManager();

            expect(setupSpy).toHaveBeenCalledWith();
            expect(initSpy).toHaveBeenCalledWith();
            expect(manager.eventListeners).toBeInstanceOf(Map);
        });

        it("should set up state subscriptions during initializeReactiveElements", () => {
            expect.assertions(2);

            const manager = new UIStateManager();

            const subscriptions = vi
                .mocked(subscribe)
                .mock.calls.map(([path, callback]) => [path, typeof callback]);

            expect(subscriptions).toStrictEqual([
                ["ui.activeTab", "function"],
                ["ui.theme", "function"],
                ["ui.unloadButtonVisible", "function"],
                ["ui.fileInfo", "function"],
                ["ui.loadingIndicator", "function"],
                ["isLoading", "function"],
                ["charts.controlsVisible", "function"],
                ["map.measurementMode", "function"],
                ["ui.dropOverlay.visible", "function"],
            ]);
            expect(manager.eventListeners.size).toBe(0);
        });
    });

    describe("theme management", () => {
        it("should apply light theme correctly", () => {
            expect.assertions(2);

            const manager = new UIStateManager();

            manager.applyTheme("light");

            expect(document.documentElement.getAttribute("data-theme")).toBe(
                "light"
            );
            expect(
                document.documentElement.getAttribute("data-theme")
            ).not.toBe("dark");
        });

        it("should apply dark theme correctly", () => {
            expect.assertions(1);

            const manager = new UIStateManager();

            manager.applyTheme("dark");

            expect(document.documentElement.getAttribute("data-theme")).toBe(
                "dark"
            );
        });

        it("should handle system theme with matchMedia support", () => {
            expect.assertions(2);

            const manager = new UIStateManager();
            const mockMatchMedia = vi.fn<(query: string) => MockMediaQueryList>(
                () => createMockMediaQueryList({ matches: true })
            );
            setTestGlobal("matchMedia", mockMatchMedia);

            manager.applyTheme("system");

            expect(mockMatchMedia).toHaveBeenCalledWith(
                "(prefers-color-scheme: dark)"
            );
            expect(document.documentElement.getAttribute("data-theme")).toBe(
                "dark"
            );
        });

        it("should handle system theme when matchMedia is not available", () => {
            expect.assertions(1);

            const manager = new UIStateManager();
            setTestGlobal("matchMedia", undefined);

            manager.applyTheme("system");

            expect(document.documentElement.getAttribute("data-theme")).toBe(
                "light"
            );
        });

        it("should use legacy addListener when addEventListener is not available", () => {
            expect.assertions(3);

            const manager = new UIStateManager();
            const addListener =
                vi.fn<
                    (callback: (event: MediaQueryListEvent) => void) => void
                >();
            const mockMatchMedia = vi.fn<(query: string) => MockMediaQueryList>(
                () => ({
                    ...createMockMediaQueryList(),
                    addEventListener:
                        undefined as unknown as MediaQueryList["addEventListener"],
                    addListener,
                })
            );
            setTestGlobal("matchMedia", mockMatchMedia);

            manager.applyTheme("system");

            const [listener] = addListener.mock.calls[0] ?? [];
            expect(listener).toBe(manager.systemThemeListener);
            expect(addListener).toHaveBeenCalledExactlyOnceWith(listener);
            expect(document.documentElement.getAttribute("data-theme")).toBe(
                "light"
            );
        });

        it("should update theme buttons when applying theme", () => {
            expect.assertions(1);

            const manager = new UIStateManager();
            const darkButton = document.querySelector('[data-theme="dark"]');
            const lightButton = document.querySelector('[data-theme="light"]');

            manager.applyTheme("dark");

            expect(
                getElementClassState({
                    darkButton,
                    lightButton,
                })
            ).toStrictEqual({
                darkButton: ["active"],
                lightButton: [],
            });
        });

        it("should clean up system theme listener when switching to explicit theme", () => {
            expect.assertions(3);

            const manager = new UIStateManager();
            const removeEventListener =
                vi.fn<
                    (
                        type: string,
                        listener: EventListenerOrEventListenerObject,
                        options?: EventListenerOptions | boolean
                    ) => void
                >();
            const mockMatchMedia = vi.fn<(query: string) => MockMediaQueryList>(
                () => ({
                    ...createMockMediaQueryList(),
                    removeEventListener,
                })
            );
            setTestGlobal("matchMedia", mockMatchMedia);

            // First apply system theme to set up listener
            manager.applyTheme("system");
            const systemThemeListener = manager.systemThemeListener;
            expect(systemThemeListener).toBeTypeOf("function");

            // Then switch to explicit theme
            manager.applyTheme("dark");

            expect(removeEventListener).toHaveBeenCalledExactlyOnceWith(
                "change",
                systemThemeListener
            );
            expect(manager.systemThemeListener).toBeNull();
        });

        it("should use legacy removeListener when removeEventListener is not available", () => {
            expect.assertions(3);

            const manager = new UIStateManager();
            const removeListener =
                vi.fn<
                    (callback: (event: MediaQueryListEvent) => void) => void
                >();
            const mockMatchMedia = vi.fn<(query: string) => MockMediaQueryList>(
                () => ({
                    ...createMockMediaQueryList(),
                    removeEventListener:
                        undefined as unknown as MediaQueryList["removeEventListener"],
                    removeListener,
                })
            );
            setTestGlobal("matchMedia", mockMatchMedia);

            // Apply system theme then switch to explicit theme
            manager.applyTheme("system");
            const systemThemeListener = manager.systemThemeListener;
            expect(systemThemeListener).toBeTypeOf("function");
            manager.applyTheme("light");

            expect(removeListener).toHaveBeenCalledExactlyOnceWith(
                systemThemeListener
            );
            expect(manager.systemThemeListener).toBeNull();
        });
    });

    describe("event listener setup", () => {
        it("should set up tab button event listeners", () => {
            expect.assertions(6);

            const manager = new UIStateManager();

            // Check that addEventListener was called on tab buttons
            const tabButton = document.querySelector('[data-tab="charts"]');
            expect(tabButton).toBeInstanceOf(HTMLButtonElement);
            getElementClickListenerRegistration(tabButton, manager);
            expect(manager.eventListenerAbortController.signal.aborted).toBe(
                false
            );
        });

        it("should handle tab button clicks", () => {
            expect.assertions(2);

            new UIStateManager();

            const tabButton = document.querySelector(
                '[data-tab="charts"]'
            ) as HTMLElement;
            tabButton.click();

            expect(vi.mocked(AppActions.switchTab)).toHaveBeenCalledWith(
                "charts"
            );
            expect(tabButton.dataset.tab).toBe("charts");
        });

        it("should set up theme button event listeners", () => {
            expect.assertions(6);

            const manager = new UIStateManager();

            const themeButton = document.querySelector('[data-theme="dark"]');
            expect(themeButton).toBeInstanceOf(HTMLButtonElement);
            getElementClickListenerRegistration(themeButton, manager);
            expect(manager.eventListenerAbortController.signal.aborted).toBe(
                false
            );
        });

        it("should handle theme button clicks", () => {
            expect.assertions(2);

            new UIStateManager();

            const themeButton = document.querySelector(
                '[data-theme="dark"]'
            ) as HTMLElement;
            themeButton.click();

            expect(vi.mocked(AppActions.switchTheme)).toHaveBeenCalledWith(
                "dark"
            );
            expect(themeButton.dataset.theme).toBe("dark");
        });

        it("should set up chart controls toggle listener", () => {
            expect.assertions(6);

            const manager = new UIStateManager();

            const toggleButton = document.querySelector(
                "#chart-controls-toggle"
            );
            expect(toggleButton).toBeInstanceOf(HTMLDivElement);
            getElementClickListenerRegistration(toggleButton, manager);
            expect(manager.eventListenerAbortController.signal.aborted).toBe(
                false
            );
        });

        it("should handle chart controls toggle clicks", () => {
            expect.assertions(2);

            new UIStateManager();

            const toggleButton = document.querySelector(
                "#chart-controls-toggle"
            ) as HTMLElement;
            toggleButton.click();

            expect(
                vi.mocked(AppActions.toggleChartControls)
            ).toHaveBeenCalledWith();
            expect(toggleButton.id).toBe("chart-controls-toggle");
        });

        it("should set up measurement mode toggle listener", () => {
            expect.assertions(6);

            const manager = new UIStateManager();

            const toggleButton = document.querySelector(
                "#measurement-mode-toggle"
            );
            expect(toggleButton).toBeInstanceOf(HTMLDivElement);
            getElementClickListenerRegistration(toggleButton, manager);
            expect(manager.eventListenerAbortController.signal.aborted).toBe(
                false
            );
        });

        it("should handle measurement mode toggle clicks", () => {
            expect.assertions(2);

            new UIStateManager();

            const toggleButton = document.querySelector(
                "#measurement-mode-toggle"
            ) as HTMLElement;
            toggleButton.click();

            expect(
                vi.mocked(AppActions.toggleMeasurementMode)
            ).toHaveBeenCalledWith();
            expect(toggleButton.id).toBe("measurement-mode-toggle");
        });

        it("should handle missing elements gracefully", () => {
            expect.assertions(3);

            // Remove some elements
            removeElementIfPresent("chart-controls-toggle");
            removeElementIfPresent("measurement-mode-toggle");

            const manager = new UIStateManager();

            expect(manager).toBeInstanceOf(UIStateManager);
            expect(document.getElementById("chart-controls-toggle")).toBeNull();
            expect(
                document.getElementById("measurement-mode-toggle")
            ).toBeNull();
        });
    });

    describe("file display UI", () => {
        it("should render displayName as text (no HTML injection)", () => {
            expect.assertions(4);

            // Add the elements used by updateFileDisplayUI
            appendFixtureElement("div", { id: "activeFileNameContainer" });
            appendFixtureElement("div", { id: "activeFileName" });

            // Ensure globalData is present so the UI is considered renderable.
            vi.mocked(getState).mockImplementation((key: any) => {
                if (key === "fitFile.rawData") return { ok: true } as any;
                return false as any;
            });

            const manager = new UIStateManager();
            const displayName = "<img src=x onerror=alert(1)>";

            manager.updateFileDisplayUI({
                displayName,
                hasFile: true,
                title: "Test",
            });

            const fileSpan = document.getElementById(
                "activeFileName"
            ) as HTMLElement;
            expect(fileSpan).toBeInstanceOf(HTMLElement);

            // Verify malicious markup did not become DOM.
            expect(fileSpan.querySelector("img")).toBeNull();

            const nameNode = getRequiredDescendant(
                fileSpan,
                ".filename-text",
                HTMLElement
            );
            expect(nameNode.textContent).toBe(displayName);
            expect(fileSpan.title).toBe(displayName);
        });
    });

    describe("notification system", () => {
        it("should handle string notification parameter", () => {
            expect.assertions(3);

            const manager = new UIStateManager();
            vi.mocked(showNotification).mockImplementation(
                renderNotificationToDom
            );

            manager.showNotification("Test message");

            expect(getRenderedNotificationState()).toStrictEqual({
                duration: "3000",
                text: "Test message",
                type: "info",
            });
            expect(vi.mocked(showNotification)).toHaveBeenCalledWith(
                "Test message",
                "info",
                3000
            );
            expect(getStableLastNotificationState()).toStrictEqual({
                notification: {
                    message: "Test message",
                    timestampType: "number",
                    type: "info",
                },
                options: { source: "UIStateManager.showNotification" },
                path: "ui.lastNotification",
            });
        });

        it("should handle object notification parameter", () => {
            expect.assertions(3);

            const manager = new UIStateManager();
            const notification = {
                message: "Error occurred",
                type: "error",
                duration: 5000,
            };
            vi.mocked(showNotification).mockImplementation(
                renderNotificationToDom
            );

            manager.showNotification(notification);

            expect(getRenderedNotificationState()).toStrictEqual({
                duration: "5000",
                text: "Error occurred",
                type: "error",
            });
            expect(vi.mocked(showNotification)).toHaveBeenCalledWith(
                "Error occurred",
                "error",
                5000
            );
            expect(getStableLastNotificationState()).toStrictEqual({
                notification: {
                    message: "Error occurred",
                    timestampType: "number",
                    type: "error",
                },
                options: { source: "UIStateManager.showNotification" },
                path: "ui.lastNotification",
            });
        });

        it("should handle object notification with default values", () => {
            expect.assertions(3);

            const manager = new UIStateManager();
            const notification = { message: "Test" };
            vi.mocked(showNotification).mockImplementation(
                renderNotificationToDom
            );

            manager.showNotification(notification);

            expect(getRenderedNotificationState()).toStrictEqual({
                duration: "3000",
                text: "Test",
                type: "info",
            });
            expect(vi.mocked(showNotification)).toHaveBeenCalledWith(
                "Test",
                "info",
                3000
            );
            expect(getStableLastNotificationState()).toStrictEqual({
                notification: {
                    message: "Test",
                    timestampType: "number",
                    type: "info",
                },
                options: { source: "UIStateManager.showNotification" },
                path: "ui.lastNotification",
            });
        });

        it("should handle invalid notification parameter", () => {
            expect.assertions(4);

            const manager = new UIStateManager();
            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            manager.showNotification(null);

            expect(consoleSpy).toHaveBeenCalledWith(
                "[UIStateManager] Invalid notification parameter:",
                null
            );
            expect(vi.mocked(showNotification)).not.toHaveBeenCalled();
            expect(getRenderedNotificationState()).toBeNull();
            expect(vi.mocked(setState)).not.toHaveBeenCalled();
        });

        it("should fallback to console logging when showNotification fails", async () => {
            expect.assertions(3);

            const manager = new UIStateManager();
            const consoleLogSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});
            vi.mocked(showNotification).mockImplementation(() => {
                throw new Error("Notification failed");
            });

            manager.showNotification("Test message");

            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[Notification INFO] Test message"
            );
            expect(getRenderedNotificationState()).toBeNull();
            expect(getStableLastNotificationState()).toStrictEqual({
                notification: {
                    message: "Test message",
                    timestampType: "number",
                    type: "info",
                },
                options: { source: "UIStateManager.showNotification" },
                path: "ui.lastNotification",
            });
        });

        it("should handle error notification fallback", async () => {
            expect.assertions(4);

            const manager = new UIStateManager();
            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            vi.mocked(showNotification).mockImplementation(() => {
                throw new Error("Notification failed");
            });

            manager.showNotification({
                message: "Error message",
                type: "error",
            });

            expect(vi.mocked(showNotification)).toHaveBeenCalledWith(
                "Error message",
                "error",
                3000
            );
            expect(getRenderedNotificationState()).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith("ERROR: Error message");
            expect(getStableLastNotificationState()).toStrictEqual({
                notification: {
                    message: "Error message",
                    timestampType: "number",
                    type: "error",
                },
                options: { source: "UIStateManager.showNotification" },
                path: "ui.lastNotification",
            });
        });
    });

    describe("ui update methods", () => {
        describe("updateChartControlsUI", () => {
            it("should show chart controls when visible", () => {
                expect.assertions(3);

                const manager = new UIStateManager();
                const chartControls = document.getElementById(
                    "chartjs-settings-wrapper"
                ) as HTMLElement;
                const toggleBtn = document.getElementById(
                    "chart-controls-toggle"
                ) as HTMLElement;

                manager.updateChartControlsUI(true);

                expect(chartControls.style.display).toBe("block");
                expect(toggleBtn.textContent).toBe("▼ Hide Controls");
                expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");
            });

            it("should hide chart controls when not visible", () => {
                expect.assertions(3);

                const manager = new UIStateManager();
                const chartControls = document.getElementById(
                    "chartjs-settings-wrapper"
                ) as HTMLElement;
                const toggleBtn = document.getElementById(
                    "chart-controls-toggle"
                ) as HTMLElement;

                manager.updateChartControlsUI(false);

                expect(chartControls.style.display).toBe("none");
                expect(toggleBtn.textContent).toBe("▶ Show Controls");
                expect(toggleBtn.getAttribute("aria-expanded")).toBe("false");
            });

            it("should handle missing elements gracefully", () => {
                expect.assertions(2);

                const manager = new UIStateManager();
                removeElementIfPresent("chartjs-settings-wrapper");
                removeElementIfPresent("chart-controls-toggle");

                manager.updateChartControlsUI(true);

                expect(
                    document.getElementById("chartjs-settings-wrapper")
                ).toBeNull();
                expect(
                    document.getElementById("chart-controls-toggle")
                ).toBeNull();
            });
        });

        describe("updateLoadingIndicator", () => {
            it("should show loading indicator when loading", () => {
                expect.assertions(4);

                const manager = new UIStateManager();
                const loadingIndicator = document.getElementById(
                    "loading-indicator"
                ) as HTMLElement;
                const mainContent = document.getElementById(
                    "main-content"
                ) as HTMLElement;

                manager.updateLoadingIndicator(true);

                expect(loadingIndicator.style.display).toBe("block");
                expect(mainContent.style.opacity).toBe("0.5");
                expect(mainContent.style.pointerEvents).toBe("none");
                expect(document.body.style.cursor).toBe("wait");
            });

            it("should hide loading indicator when not loading", () => {
                expect.assertions(4);

                const manager = new UIStateManager();
                const loadingIndicator = document.getElementById(
                    "loading-indicator"
                ) as HTMLElement;
                const mainContent = document.getElementById(
                    "main-content"
                ) as HTMLElement;

                manager.updateLoadingIndicator(false);

                expect(loadingIndicator.style.display).toBe("none");
                expect(mainContent.style.opacity).toBe("1");
                expect(mainContent.style.pointerEvents).toBe("auto");
                expect(document.body.style.cursor).toBe("default");
            });

            it("should handle missing elements gracefully", () => {
                expect.assertions(3);

                const manager = new UIStateManager();
                removeElementIfPresent("loading-indicator");
                removeElementIfPresent("main-content");

                manager.updateLoadingIndicator(true);

                expect(document.getElementById("loading-indicator")).toBeNull();
                expect(document.getElementById("main-content")).toBeNull();
                expect(document.body.style.cursor).toBe("wait");
            });
        });

        describe("updateDropOverlayVisibility", () => {
            it("should show the drop overlay and disable iframe pointer events", () => {
                expect.assertions(3);

                const manager = new UIStateManager();
                const dropOverlay = document.getElementById(
                    "drop_overlay"
                ) as HTMLElement;
                const altFitIframe = document.getElementById(
                    "altfit_iframe"
                ) as HTMLElement;
                const zwiftIframe = document.getElementById(
                    "zwift_iframe"
                ) as HTMLElement;

                manager.updateDropOverlayVisibility(true);

                expect(dropOverlay.style.display).toBe("flex");
                expect(altFitIframe.style.pointerEvents).toBe("none");
                expect(zwiftIframe.style.pointerEvents).toBe("none");
            });

            it("should hide the drop overlay and restore iframe pointer events", () => {
                expect.assertions(3);

                const manager = new UIStateManager();
                const dropOverlay = document.getElementById(
                    "drop_overlay"
                ) as HTMLElement;
                const altFitIframe = document.getElementById(
                    "altfit_iframe"
                ) as HTMLElement;
                const zwiftIframe = document.getElementById(
                    "zwift_iframe"
                ) as HTMLElement;

                altFitIframe.style.pointerEvents = "none";
                zwiftIframe.style.pointerEvents = "none";

                manager.updateDropOverlayVisibility(false);

                expect(dropOverlay.style.display).toBe("none");
                expect(altFitIframe.style.pointerEvents).toBe("");
                expect(zwiftIframe.style.pointerEvents).toBe("");
            });

            it("should handle missing drop overlay elements gracefully", () => {
                expect.assertions(3);

                const manager = new UIStateManager();
                removeElementIfPresent("drop_overlay");
                removeElementIfPresent("altfit_iframe");
                removeElementIfPresent("zwift_iframe");

                manager.updateDropOverlayVisibility(true);

                expect(document.getElementById("drop_overlay")).toBeNull();
                expect(document.getElementById("altfit_iframe")).toBeNull();
                expect(document.getElementById("zwift_iframe")).toBeNull();
            });
        });

        describe("updateMeasurementModeUI", () => {
            it("should activate measurement mode UI", () => {
                expect.assertions(1);

                const manager = new UIStateManager();
                const toggleBtn = document.getElementById(
                    "measurement-mode-toggle"
                ) as HTMLElement;
                const mapContainer = document.getElementById(
                    "map-container"
                ) as HTMLElement;

                manager.updateMeasurementModeUI(true);

                expect({
                    mapContainerClasses: [...mapContainer.classList],
                    toggleButtonClasses: [...toggleBtn.classList],
                    toggleText: toggleBtn.textContent,
                }).toStrictEqual({
                    mapContainerClasses: ["measurement-mode"],
                    toggleButtonClasses: ["active"],
                    toggleText: "Exit Measurement",
                });
            });

            it("should deactivate measurement mode UI", () => {
                expect.assertions(3);

                const manager = new UIStateManager();
                const toggleBtn = document.getElementById(
                    "measurement-mode-toggle"
                ) as HTMLElement;
                const mapContainer = document.getElementById(
                    "map-container"
                ) as HTMLElement;

                manager.updateMeasurementModeUI(false);

                expect({
                    mapContainerClasses: [...mapContainer.classList],
                    toggleButtonClasses: [...toggleBtn.classList],
                    toggleText: toggleBtn.textContent,
                }).toStrictEqual({
                    mapContainerClasses: [],
                    toggleButtonClasses: [],
                    toggleText: "Measure Distance",
                });
                expect([...toggleBtn.classList]).not.toContain("active");
                expect([...mapContainer.classList]).not.toContain(
                    "measurement-mode"
                );
            });
        });

        describe("updateUnloadButtonVisibility", () => {
            it("should show the unload button when visible", () => {
                expect.assertions(1);

                const manager = new UIStateManager();
                const unloadButton = document.getElementById(
                    "unload_file_btn"
                ) as HTMLElement;

                unloadButton.style.display = "none";

                manager.updateUnloadButtonVisibility(true);

                expect(unloadButton.style.display).toBe("");
            });

            it("should hide the unload button when not visible", () => {
                expect.assertions(1);

                const manager = new UIStateManager();
                const unloadButton = document.getElementById(
                    "unload_file_btn"
                ) as HTMLElement;

                manager.updateUnloadButtonVisibility(false);

                expect(unloadButton.style.display).toBe("none");
            });

            it("should handle a missing unload button gracefully", () => {
                expect.assertions(1);

                const manager = new UIStateManager();
                removeElementIfPresent("unload_file_btn");

                manager.updateUnloadButtonVisibility(false);

                expect(document.getElementById("unload_file_btn")).toBeNull();
            });
        });

        describe("updateTabButtons", () => {
            it("should update tab button states", () => {
                expect.assertions(2);

                const manager = new UIStateManager();
                const chartsButton = document.querySelector(
                    '[data-tab="charts"]'
                ) as HTMLElement;
                const mapButton = document.querySelector(
                    '[data-tab="map"]'
                ) as HTMLElement;

                manager.updateTabButtons("charts");

                expect({
                    chartsButtonAriaSelected:
                        chartsButton.getAttribute("aria-selected"),
                    chartsButtonClasses: [...chartsButton.classList],
                    mapButtonAriaSelected:
                        mapButton.getAttribute("aria-selected"),
                    mapButtonClasses: [...mapButton.classList],
                }).toStrictEqual({
                    chartsButtonAriaSelected: "true",
                    chartsButtonClasses: ["active"],
                    mapButtonAriaSelected: "false",
                    mapButtonClasses: [],
                });
                expect([...mapButton.classList]).not.toContain("active");
            });
        });

        describe("updateTabVisibility", () => {
            it("should update tab content visibility", () => {
                expect.assertions(5);

                const manager = new UIStateManager();
                const chartsContent = document.querySelector(
                    '[data-tab-content="charts"]'
                ) as HTMLElement;
                const mapContent = document.querySelector(
                    '[data-tab-content="map"]'
                ) as HTMLElement;

                manager.updateTabVisibility("charts");

                expect(chartsContent.style.display).toBe("block");
                expect(chartsContent.getAttribute("aria-hidden")).toBe("false");
                expect(mapContent.style.display).toBe("none");
                expect(mapContent.getAttribute("aria-hidden")).toBe("true");
                expect(mapContent.style.display).not.toBe("block");
            });
        });
    });

    describe("sidebar management", () => {
        it("should toggle sidebar from state", () => {
            expect.assertions(2);

            const manager = new UIStateManager();
            vi.mocked(getState).mockReturnValue(false);

            manager.toggleSidebar(undefined);

            expect(vi.mocked(setState)).toHaveBeenCalledWith(
                "ui.sidebarCollapsed",
                true,
                {
                    source: "UIStateManager.toggleSidebar",
                }
            );
            expect(getClassState("sidebar", "main-content")).toStrictEqual({
                "main-content": ["sidebar-collapsed"],
                sidebar: ["collapsed"],
            });
        });

        it("should set sidebar to specific state", () => {
            expect.assertions(2);

            const manager = new UIStateManager();

            manager.toggleSidebar(true);

            expect(vi.mocked(setState)).toHaveBeenCalledWith(
                "ui.sidebarCollapsed",
                true,
                {
                    source: "UIStateManager.toggleSidebar",
                }
            );
            expect(getClassState("main-content")).toStrictEqual({
                "main-content": ["sidebar-collapsed"],
            });
        });

        it("should expand sidebar when set to false", () => {
            expect.assertions(3);

            const manager = new UIStateManager();

            manager.toggleSidebar(false);

            expect(vi.mocked(setState)).toHaveBeenCalledWith(
                "ui.sidebarCollapsed",
                false,
                {
                    source: "UIStateManager.toggleSidebar",
                }
            );
            expect(getClassState("sidebar", "main-content")).toStrictEqual({
                "main-content": [],
                sidebar: [],
            });
            expect(getElementClassList("main-content")).not.toContain(
                "sidebar-collapsed"
            );
        });

        it("should update sidebar DOM elements", () => {
            expect.assertions(1);

            const manager = new UIStateManager();
            const sidebar = document.getElementById("sidebar") as HTMLElement;
            const mainContent = document.getElementById(
                "main-content"
            ) as HTMLElement;

            manager.toggleSidebar(true);

            expect({
                mainContentClasses: [...mainContent.classList],
                sidebarClasses: [...sidebar.classList],
            }).toStrictEqual({
                mainContentClasses: ["sidebar-collapsed"],
                sidebarClasses: ["collapsed"],
            });
        });
    });

    describe("window state management", () => {
        it("should update window state from DOM", () => {
            expect.assertions(3);

            const manager = new UIStateManager();

            manager.updateWindowStateFromDOM();

            expect(vi.mocked(updateState)).toHaveBeenCalledWith(
                "ui.windowState",
                {
                    height: 800,
                    width: 1200,
                    maximized: false,
                    x: 100,
                    y: 200,
                },
                { source: "UIStateManager.updateWindowStateFromDOM" }
            );
            expect(vi.mocked(updateState).mock.calls.at(-1)).toStrictEqual([
                "ui.windowState",
                {
                    height: 800,
                    width: 1200,
                    maximized: false,
                    x: 100,
                    y: 200,
                },
                { source: "UIStateManager.updateWindowStateFromDOM" },
            ]);
            expect(
                vi.mocked(updateState).mock.calls.at(-1)?.[1]
            ).not.toStrictEqual({
                height: 800,
                width: 1200,
                maximized: true,
                x: 100,
                y: 200,
            });
        });

        it("should detect maximized window", () => {
            expect.assertions(2);

            const manager = new UIStateManager();
            Object.defineProperty(window, "outerWidth", {
                value: 1920,
                writable: true,
            });
            Object.defineProperty(window, "outerHeight", {
                value: 1080,
                writable: true,
            });

            manager.updateWindowStateFromDOM();

            expect(vi.mocked(updateState).mock.calls.at(-1)).toStrictEqual([
                "ui.windowState",
                {
                    height: 800,
                    width: 1200,
                    maximized: true,
                    x: 100,
                    y: 200,
                },
                { source: "UIStateManager.updateWindowStateFromDOM" },
            ]);
            expect(window.outerWidth).toBe(window.screen.availWidth);
        });
    });

    describe("cleanup", () => {
        it("should clean up system theme listener", () => {
            expect.assertions(4);

            const manager = new UIStateManager();
            const removeEventListener =
                vi.fn<
                    (
                        type: string,
                        listener: EventListenerOrEventListenerObject,
                        options?: EventListenerOptions | boolean
                    ) => void
                >();
            const mockMatchMedia = vi.fn<(query: string) => MockMediaQueryList>(
                () => ({
                    ...createMockMediaQueryList(),
                    removeEventListener,
                })
            );
            setTestGlobal("matchMedia", mockMatchMedia);

            // Set up system theme listener
            manager.applyTheme("system");
            const systemThemeListener = manager.systemThemeListener;
            expect(systemThemeListener).toBeTypeOf("function");

            manager.cleanup();

            expect(removeEventListener).toHaveBeenCalledExactlyOnceWith(
                "change",
                systemThemeListener
            );
            expect([...manager.eventListeners]).toStrictEqual([]);
            expect(manager.systemThemeListener).not.toBe(removeEventListener);
        });

        it("should clear event listeners map", () => {
            expect.assertions(1);

            const manager = new UIStateManager();

            manager.cleanup();

            expect([...manager.eventListeners]).toStrictEqual([]);
        });
    });

    describe("global instance and convenience functions", () => {
        it("should have global uiStateManager instance", () => {
            expect.assertions(1);

            expect(uiStateManager).toBeInstanceOf(UIStateManager);
        });

        it("should provide UIActions.setTheme convenience function", () => {
            expect.assertions(3);
            vi.mocked(AppActions.switchTheme).mockImplementation((theme) => {
                document.documentElement.dataset.theme = theme;
            });

            UIActions.setTheme("dark");

            expect(document.documentElement.dataset.theme).toBe("dark");
            expect(document.documentElement.dataset.theme).not.toBe("light");
            expect(vi.mocked(AppActions.switchTheme)).toHaveBeenCalledWith(
                "dark"
            );
        });

        it("should provide UIActions.showTab convenience function", () => {
            expect.assertions(2);
            vi.mocked(AppActions.switchTab).mockImplementation((tabName) => {
                document.body.dataset.activeTab = tabName;
            });

            UIActions.showTab("charts");

            expect(document.body.dataset.activeTab).toBe("charts");
            expect(vi.mocked(AppActions.switchTab)).toHaveBeenCalledWith(
                "charts"
            );
        });

        it("should provide UIActions.toggleChartControls convenience function", () => {
            expect.assertions(2);
            vi.mocked(AppActions.toggleChartControls).mockImplementation(() => {
                const chartControls = document.getElementById(
                    "chartjs-settings-wrapper"
                );
                if (chartControls) {
                    chartControls.classList.toggle("visible");
                }
            });

            UIActions.toggleChartControls();

            expect(getElementClassList("chartjs-settings-wrapper")).toContain(
                "visible"
            );
            expect(
                vi.mocked(AppActions.toggleChartControls)
            ).toHaveBeenCalledWith();
        });

        it("should provide UIActions.toggleMeasurementMode convenience function", () => {
            expect.assertions(2);
            vi.mocked(AppActions.toggleMeasurementMode).mockImplementation(
                () => {
                    document
                        .getElementById("map-container")
                        ?.classList.toggle("measurement-mode");
                }
            );

            UIActions.toggleMeasurementMode();

            expect(getElementClassList("map-container")).toContain(
                "measurement-mode"
            );
            expect(
                vi.mocked(AppActions.toggleMeasurementMode)
            ).toHaveBeenCalledWith();
        });

        it("should provide UIActions.toggleSidebar convenience function", () => {
            expect.assertions(3);

            const toggleSidebarSpy = vi.spyOn(uiStateManager, "toggleSidebar");

            UIActions.toggleSidebar(true);

            expect(getRequiredElement("sidebar").className).toBe("collapsed");
            expect(getElementClassList("main-content")).toContain(
                "sidebar-collapsed"
            );
            expect(toggleSidebarSpy).toHaveBeenCalledWith(true);
        });

        it("should provide UIActions.updateWindowState convenience function", () => {
            expect.assertions(2);

            const updateWindowStateSpy = vi.spyOn(
                uiStateManager,
                "updateWindowStateFromDOM"
            );
            vi.mocked(updateState).mockImplementation(() => {
                document.body.dataset.windowStateUpdated = "true";
            });

            UIActions.updateWindowState();

            expect(document.body.dataset.windowStateUpdated).toBe("true");
            expect(updateWindowStateSpy).toHaveBeenCalledWith();
        });
    });
});
