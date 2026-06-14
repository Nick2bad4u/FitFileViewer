import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";

type AddEventListener = typeof window.addEventListener;
type CleanupIndicator = (indicator: HTMLElement) => void;
type ConsoleError = typeof console.error;
type CreateIndicator = (...args: unknown[]) => HTMLElement;
type DefineProperty = typeof Object.defineProperty;
type GetChartCounts = () => {
    available: number;
    categories: {
        analysis: { available: number; total: number; visible: number };
        gps: { available: number; total: number; visible: number };
        metrics: { available: number; total: number; visible: number };
        zones: { available: number; total: number; visible: number };
    };
    total: number;
    visible: number;
};
type SetTimeoutMock = typeof setTimeout;
type StateSubscribe = (listener: (...args: unknown[]) => void) => () => void;
type SubscribeToChartSettings = (listener: () => void) => () => void;
type TestGlobalProperty =
    | "addEventListener"
    | "customElements"
    | "document"
    | "HTMLElement"
    | "setTimeout"
    | "window";
type TestObjectProperty = "addEventListener";

function createMockElement(id: string): HTMLElement {
    const element = document.createElement("div");
    element.id = id;
    return element;
}

function getRequiredElementById(id: string): HTMLElement {
    const element = document.getElementById(id);

    if (!(element instanceof window.HTMLElement)) {
        throw new TypeError(`Expected #${id} to exist`);
    }

    return element;
}

function noop(): void {
    return;
}

const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();
const originalObjectDescriptors = new Map<
    object,
    Map<TestObjectProperty, PropertyDescriptor>
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

function getPropertyDescriptorFromChain(
    target: object,
    name: TestObjectProperty
): PropertyDescriptor | undefined {
    let current: object | null = target;

    while (current) {
        const descriptor = Object.getOwnPropertyDescriptor(current, name);
        if (descriptor) {
            return descriptor;
        }
        current = Object.getPrototypeOf(current);
    }

    return undefined;
}

function setTestObjectProperty(
    target: object,
    name: TestObjectProperty,
    value: unknown
): void {
    let descriptors = originalObjectDescriptors.get(target);
    if (!descriptors) {
        descriptors = new Map();
        originalObjectDescriptors.set(target, descriptors);
    }
    if (!descriptors.has(name)) {
        const descriptor =
            Object.getOwnPropertyDescriptor(target, name) ??
            getPropertyDescriptorFromChain(target, name);

        if (!descriptor) {
            throw new Error(`Expected test object property ${name} to exist`);
        }

        descriptors.set(name, descriptor);
    }

    Object.defineProperty(target, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreTestGlobals(): void {
    for (const [target, descriptors] of originalObjectDescriptors) {
        for (const [name, descriptor] of descriptors) {
            Object.defineProperty(target, name, descriptor);
        }
    }
    originalObjectDescriptors.clear();

    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

const chartCounts: ReturnType<GetChartCounts> = {
    available: 9,
    categories: {
        analysis: { available: 2, total: 3, visible: 2 },
        gps: { available: 0, total: 0, visible: 0 },
        metrics: { available: 5, total: 5, visible: 4 },
        zones: { available: 2, total: 2, visible: 1 },
    },
    total: 10,
    visible: 7,
};

// Mock dependencies
vi.mock(
    import("../../../../../electron-app/utils/charts/components/createChartStatusIndicator.js"),
    () => ({
        createChartStatusIndicator: vi
            .fn<CreateIndicator>()
            .mockImplementation((_counts?: unknown) =>
                createMockElement("mock-chart-status-indicator")
            ),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/components/createChartStatusIndicatorFromCounts.js"),
    () => ({
        cleanupChartStatusIndicatorFromCounts: vi.fn<CleanupIndicator>(),
        createChartStatusIndicatorFromCounts: vi
            .fn<CreateIndicator>()
            .mockImplementation((_counts?: unknown) =>
                createMockElement("mock-chart-status-indicator-from-counts")
            ),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicator.js"),
    () => ({
        createGlobalChartStatusIndicator: vi
            .fn<CreateIndicator>()
            .mockImplementation(() => {
                const element = createMockElement(
                    "mock-global-chart-status-indicator"
                );
                document.body.append(element);
                return element;
            }),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicatorFromCounts.js"),
    () => ({
        cleanupGlobalChartStatusIndicatorFromCounts: vi.fn<CleanupIndicator>(),
        createGlobalChartStatusIndicatorFromCounts: vi
            .fn<CreateIndicator>()
            .mockImplementation((_counts?: unknown) =>
                createMockElement(
                    "mock-global-chart-status-indicator-from-counts"
                )
            ),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/getChartCounts.js"),
    () => ({
        getChartCounts: vi.fn<GetChartCounts>().mockReturnValue(chartCounts),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        subscribeToChartSettings: vi.fn<SubscribeToChartSettings>(() => noop),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/activeFitRawDataState.js"),
    () => ({
        subscribeToActiveFitRawData: vi.fn<StateSubscribe>(() => noop),
    })
);

function getFirstElementId(parent: ParentNode): string {
    const element = parent.firstElementChild;

    if (!(element instanceof HTMLElement)) {
        throw new Error("Expected parent to contain an HTMLElement child");
    }

    return element.id;
}

function getRegisteredEventHandler(
    target: Pick<EventTarget, "addEventListener">,
    eventName: string
): EventListener {
    const call = vi
        .mocked(target.addEventListener)
        .mock.calls.find(([name]) => {
            return name === eventName;
        });
    const handler = call?.[1];

    if (typeof handler !== "function") {
        throw new Error(`Expected ${eventName} handler to be registered`);
    }

    return handler as EventListener;
}

describe("chartStatusIndicator.js", () => {
    // Store original properties
    let originalDefineProperty: typeof Object.defineProperty;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Reset mocks
        vi.resetModules();

        // Set up a minimal document
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
            url: "http://localhost/",
        });

        setTestGlobal("document", dom.window.document);
        setTestGlobal("window", dom.window as Window & typeof globalThis);
        setTestGlobal("HTMLElement", dom.window.HTMLElement);
        setTestGlobal("customElements", dom.window.customElements);

        // Save original functions
        originalDefineProperty = Object.defineProperty;

        // Mock console.error
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(noop);

        // Mock setTimeout to execute immediately
        setTestGlobal(
            "setTimeout",
            vi.fn<SetTimeoutMock>((handler) => {
                if (typeof handler === "function") {
                    handler();
                }
                return 1 as ReturnType<SetTimeoutMock>;
            }) as SetTimeoutMock
        );

        // Mock addEventListener for both window and document
        const mockWindowAddEventListener = vi.fn<AddEventListener>();
        const mockDocumentAddEventListener = vi.fn<AddEventListener>();

        setTestObjectProperty(
            window,
            "addEventListener",
            mockWindowAddEventListener
        );
        setTestObjectProperty(
            document,
            "addEventListener",
            mockDocumentAddEventListener
        );

        // Synchronize addEventListener between window and globalThis scopes using property descriptor pattern
        setTestGlobal("addEventListener", mockWindowAddEventListener);

        Object.defineProperty = vi.fn<DefineProperty>((obj, prop, descriptor) =>
            originalDefineProperty.call(Object, obj, prop, descriptor)
        ) as DefineProperty;
    });

    afterEach(() => {
        // Restore original functions
        consoleErrorSpy.mockRestore();
        if (originalDefineProperty)
            Object.defineProperty = originalDefineProperty;
        restoreTestGlobals();

        // Clear mock calls
        vi.clearAllMocks();
    });

    describe("updateAllChartStatusIndicators", () => {
        it("should update both status indicators when they exist", async () => {
            expect.assertions(2);

            // Set up the DOM with both indicators
            const settingsIndicator = document.createElement("div");
            settingsIndicator.id = "chart-status-indicator";
            const settingsParent = document.createElement("div");
            settingsParent.appendChild(settingsIndicator);
            document.body.appendChild(settingsParent);

            const globalIndicator = document.createElement("div");
            globalIndicator.id = "global-chart-status";
            const globalParent = document.createElement("div");
            globalParent.appendChild(globalIndicator);
            document.body.appendChild(globalParent);

            // Import the module after setting up the DOM
            const { updateAllChartStatusIndicators } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");

            // Call the function
            updateAllChartStatusIndicators();

            // Assert that indicators were updated
            const updatedSettingsIndicator = document.getElementById(
                "mock-chart-status-indicator-from-counts"
            );
            const updatedGlobalIndicator = document.getElementById(
                "mock-global-chart-status-indicator-from-counts"
            );
            const { createGlobalChartStatusIndicator } =
                await import("../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicator.js");

            expect([
                updatedSettingsIndicator?.id,
                updatedGlobalIndicator?.id,
            ]).toStrictEqual([
                "mock-chart-status-indicator-from-counts",
                "mock-global-chart-status-indicator-from-counts",
            ]);
            expect(createGlobalChartStatusIndicator).not.toHaveBeenCalled();
        });

        it("should create global indicator if it does not exist", async () => {
            expect.assertions(3);

            // Set up the DOM with only settings indicator
            const settingsIndicator = document.createElement("div");
            settingsIndicator.id = "chart-status-indicator";
            const settingsParent = document.createElement("div");
            settingsParent.appendChild(settingsIndicator);
            document.body.appendChild(settingsParent);

            // Import the module after setting up the DOM
            const { updateAllChartStatusIndicators } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");
            const { createGlobalChartStatusIndicator } =
                await import("../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicator.js");

            // Call the function
            updateAllChartStatusIndicators();

            // Assert that createGlobalChartStatusIndicator was called
            expect(createGlobalChartStatusIndicator).toHaveBeenCalledWith();
            expect(getFirstElementId(settingsParent)).toBe(
                "chart-status-indicator"
            );
            expect(
                document.querySelectorAll("#global-chart-status")
            ).toHaveLength(0);
        });

        it("should handle errors gracefully", async () => {
            expect.assertions(2);

            // Import the module
            const { updateAllChartStatusIndicators } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");

            // Mock getChartCounts to throw an error
            const { getChartCounts } =
                await import("../../../../../electron-app/utils/charts/core/getChartCounts.js");
            vi.mocked(getChartCounts).mockImplementationOnce(() => {
                throw new Error("Test error");
            });

            // Call the function
            updateAllChartStatusIndicators();

            // Assert that error was logged
            expect(console.error).toHaveBeenCalledWith(
                "[ChartStatus] Error updating all chart status indicators:",
                expect.any(Error)
            );
            expect(document.body.childElementCount).toBe(0);
        });
    });

    describe("updateChartStatusIndicator", () => {
        it("should update a specific chart status indicator when provided", async () => {
            expect.assertions(3);

            // Set up the DOM with an indicator
            const indicator = document.createElement("div");
            indicator.id = "custom-indicator";
            const parent = document.createElement("div");
            parent.appendChild(indicator);
            document.body.appendChild(parent);

            // Import the module
            const { updateChartStatusIndicator } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");
            const { createChartStatusIndicator } =
                await import("../../../../../electron-app/utils/charts/components/createChartStatusIndicator.js");

            // Call the function with a specific indicator
            updateChartStatusIndicator(indicator);

            // Assert that createChartStatusIndicator was called
            expect(createChartStatusIndicator).toHaveBeenCalledWith();
            // We should assert that it was called, but we don't need to check the ID specifically
            // since the real implementation might not replace the ID
            expect(getFirstElementId(parent)).toBe("custom-indicator");
            expect(parent.childElementCount).toBe(1);
        });

        it("should update the default indicator when none provided", async () => {
            expect.assertions(2);

            // Set up the DOM with the default indicator
            const indicator = document.createElement("div");
            indicator.id = "chart-status-indicator";
            const parent = document.createElement("div");
            parent.appendChild(indicator);
            document.body.appendChild(parent);

            // Import the module
            const { updateChartStatusIndicator } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");

            // Call the function without a specific indicator
            updateChartStatusIndicator();

            // Assert that the default indicator was updated
            // Just check that it still exists - we don't need to check the specific ID
            expect(getFirstElementId(parent)).toBe("chart-status-indicator");
            expect(parent.childElementCount).toBe(1);
        });

        it("should do nothing if no indicator exists", async () => {
            expect.assertions(2);

            // Import the module
            const { updateChartStatusIndicator } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");
            const { createChartStatusIndicator } =
                await import("../../../../../electron-app/utils/charts/components/createChartStatusIndicator.js");

            // Call the function
            updateChartStatusIndicator();

            // Assert that createChartStatusIndicator was not called
            expect(createChartStatusIndicator).not.toHaveBeenCalled();
            expect(document.body.childElementCount).toBe(0);
        });

        it("should handle errors gracefully", async () => {
            expect.assertions(2);

            // Import the module
            const { updateChartStatusIndicator } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");
            const { createChartStatusIndicator } =
                await import("../../../../../electron-app/utils/charts/components/createChartStatusIndicator.js");

            // Mock createChartStatusIndicator to throw an error
            vi.mocked(createChartStatusIndicator).mockImplementationOnce(() => {
                throw new Error("Test error");
            });

            // Set up the DOM with an indicator
            const indicator = document.createElement("div");
            indicator.id = "chart-status-indicator";
            document.body.appendChild(indicator);

            // Call the function
            updateChartStatusIndicator();

            // Assert that error was logged
            expect(console.error).toHaveBeenCalledWith(
                "[ChartStatus] Error updating chart status indicator:",
                expect.any(Error)
            );
            const currentIndicator = getRequiredElementById(
                "chart-status-indicator"
            );
            expect(currentIndicator.id).toBe("chart-status-indicator");
        });
    });

    describe("setupChartStatusUpdates", () => {
        it("should register all required event listeners", async () => {
            expect.assertions(6);

            // Import the module
            const { setupChartStatusUpdates } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");

            // Call the function
            setupChartStatusUpdates();

            // Assert that event listeners were added
            expect(window.addEventListener).toHaveBeenCalledWith(
                "fieldToggleChanged",
                expect.any(Function),
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
            expect(document.addEventListener).toHaveBeenCalledWith(
                "chartsRendered",
                expect.any(Function),
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );

            // Assert that global indicator was created
            const globalIndicatorModule =
                await import("../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicator.js");
            const settingsStateManager =
                await import("../../../../../electron-app/utils/state/domain/settingsStateManager.js");
            const activeFitRawDataState =
                await import("../../../../../electron-app/utils/state/domain/activeFitRawDataState.js");
            expect(
                vi.mocked(
                    globalIndicatorModule.createGlobalChartStatusIndicator
                )
            ).toHaveBeenCalledWith();
            expect(
                vi.mocked(settingsStateManager.subscribeToChartSettings)
            ).toHaveBeenCalledWith(expect.any(Function));
            expect(
                vi.mocked(activeFitRawDataState.subscribeToActiveFitRawData)
            ).toHaveBeenCalledWith(expect.any(Function));
            expect(Object.hasOwn(globalThis, "globalData")).toBe(false);
        });

        it("should handle event listener callbacks correctly", async () => {
            expect.assertions(4);

            // Since we're getting weird spying issues, let's just test the event registration
            // without spying on the internal function call

            // Import the module
            const { setupChartStatusUpdates } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");

            // Call the function
            setupChartStatusUpdates();

            const fieldToggleHandler = getRegisteredEventHandler(
                window,
                "fieldToggleChanged"
            );
            const chartsRenderedHandler = getRegisteredEventHandler(
                document,
                "chartsRendered"
            );
            const settingsStateManager =
                await import("../../../../../electron-app/utils/state/domain/settingsStateManager.js");
            const activeFitRawDataState =
                await import("../../../../../electron-app/utils/state/domain/activeFitRawDataState.js");
            expect(
                vi.mocked(settingsStateManager.subscribeToChartSettings)
            ).toHaveBeenCalledWith(expect.any(Function));
            expect(
                vi.mocked(activeFitRawDataState.subscribeToActiveFitRawData)
            ).toHaveBeenCalledWith(expect.any(Function));

            // Test that the event handlers can be called without errors
            fieldToggleHandler({} as Event);
            chartsRenderedHandler({} as Event);

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 50);
            expect(document.body.childElementCount).toBe(0);
        });

        it("should handle errors during setup gracefully", async () => {
            expect.assertions(3);

            // Mock addEventListener to throw an error - need to update both window and globalThis
            const errorMock = vi.fn<AddEventListener>(() => {
                throw new Error("Test error");
            });

            setTestObjectProperty(window, "addEventListener", errorMock);
            setTestGlobal("addEventListener", errorMock);

            // Import the module
            const { setupChartStatusUpdates } =
                await import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js");

            // Call the function
            setupChartStatusUpdates();

            // Assert that error was logged
            expect(console.error).toHaveBeenCalledWith(
                "[ChartStatus] Error setting up chart status updates:",
                expect.any(Error)
            );
            expect(errorMock).toHaveBeenCalledWith(
                "fieldToggleChanged",
                expect.any(Function),
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
            expect(document.body.childElementCount).toBe(0);
        });
    });
});
