import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { createStateManagerMock } from "../../../../helpers/createStateManagerMock";
import { createMarkerSummary, getMarkerPreference } from "../../../../../utils/maps/helpers/mapMarkerSummary.js";
import { clearOverlayState, setOverlayMarkerCount } from "../../../../../utils/state/domain/overlayState.js";

type WindowWithMarkerSummary = typeof globalThis & {
    updateMapMarkerSummary?: ReturnType<typeof vi.fn>;
};

type StateManagerHarness = ReturnType<typeof createStateManagerMock>;
type MockFn = ReturnType<typeof vi.fn>;

type StateManagerRefs = {
    harness?: StateManagerHarness;
    getStateMock?: MockFn;
    setStateMock?: MockFn;
    updateStateMock?: MockFn;
    subscribeMock?: MockFn;
};

const stateManagerRefs = vi.hoisted((): StateManagerRefs => ({
    harness: undefined,
    getStateMock: undefined,
    setStateMock: undefined,
    updateStateMock: undefined,
    subscribeMock: undefined,
}));

vi.mock("../../../../../utils/state/core/stateManager.js", () => {
    if (!stateManagerRefs.harness) {
        const harness = createStateManagerMock();
        stateManagerRefs.harness = harness;
        stateManagerRefs.getStateMock = vi.fn((path?: string) => harness.getState(path));
        stateManagerRefs.setStateMock = vi.fn((path: string, value: unknown, options?: any) =>
            harness.setState(path, value, options)
        );
        stateManagerRefs.updateStateMock = vi.fn((path: string, patch: Record<string, unknown>, options?: any) =>
            harness.updateState(path, patch, options)
        );
        stateManagerRefs.subscribeMock = vi.fn((path: string, listener: (value: unknown) => void) =>
            harness.subscribe(path, listener as any)
        );
    }

    return {
        getState: stateManagerRefs.getStateMock!,
        setState: stateManagerRefs.setStateMock!,
        updateState: stateManagerRefs.updateStateMock!,
        subscribe: stateManagerRefs.subscribeMock!,
    };
});

const ensureStateManagerRefs = () => {
    const { harness, getStateMock, setStateMock, updateStateMock, subscribeMock } = stateManagerRefs;
    if (!harness || !getStateMock || !setStateMock || !updateStateMock || !subscribeMock) {
        throw new Error("State manager mocks failed to initialize");
    }
    return { harness, getStateMock, setStateMock, updateStateMock, subscribeMock };
};

const { harness: stateManagerHarness, getStateMock, setStateMock, updateStateMock, subscribeMock } =
    ensureStateManagerRefs();

describe("mapMarkerSummary", () => {
    const testGlobal = globalThis as WindowWithMarkerSummary;

    beforeEach(() => {
        stateManagerHarness.reset();
        vi.clearAllMocks();
        getStateMock.mockImplementation((path?: string) => stateManagerHarness.getState(path));
        setStateMock.mockImplementation((path: string, value: unknown, options?: any) =>
            stateManagerHarness.setState(path, value, options)
        );
        updateStateMock.mockImplementation((path: string, patch: Record<string, unknown>, options?: any) =>
            stateManagerHarness.updateState(path, patch, options)
        );
        subscribeMock.mockImplementation((path: string, listener: (value: unknown) => void) =>
            stateManagerHarness.subscribe(path, listener as any)
        );

        testGlobal.updateMapMarkerSummary = vi.fn();
        clearOverlayState("mapMarkerSummary.setup");
        setOverlayMarkerCount(0, "mapMarkerSummary.setup");
    });

    afterEach(() => {
        delete testGlobal.updateMapMarkerSummary;
    });

    it("aggregates multiple record calls and emits updates", () => {
        const summary = createMarkerSummary();

        summary.reset();
        expect(testGlobal.updateMapMarkerSummary).toBeDefined();
        expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 0, total: 0 });

        summary.record(120, 40);
        expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 40, total: 120 });

        summary.record(80, 20);
        expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 60, total: 200 });

        summary.reset();
        expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 0, total: 0 });
    });

    it("treats zero rendered markers as rendering all points", () => {
        const summary = createMarkerSummary();
        summary.reset();

        summary.record(50, 0);
        expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 50, total: 50 });
    });

    it("falls back to last valid preference when setting is invalid", () => {
        setOverlayMarkerCount(25, "mapMarkerSummary.validSet");
        expect(getMarkerPreference()).toBe(25);

        setOverlayMarkerCount("not-a-number" as unknown as number, "mapMarkerSummary.invalidSet");
        expect(getMarkerPreference()).toBe(25);

        setOverlayMarkerCount(0, "mapMarkerSummary.zeroPreference");
        expect(getMarkerPreference()).toBe(0);
    });
});
