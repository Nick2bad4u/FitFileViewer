import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    subscribe: vi.fn<(key: string, listener: () => void) => () => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        subscribe: mocks.subscribe,
    })
);

import {
    registerAddFitOverlayButtonAvailabilityUpdater,
    resetAddFitOverlayButtonStateForTests,
} from "../../../../../electron-app/utils/ui/controls/addFitOverlayButtonState.js";

describe("addFitOverlayButtonState", () => {
    beforeEach(() => {
        resetAddFitOverlayButtonStateForTests();
        vi.clearAllMocks();
        mocks.subscribe.mockReturnValue(() => {});
    });

    it("subscribes once and calls the latest registered updater", () => {
        expect.assertions(4);

        let subscribedListener: (() => void) | undefined;
        const firstUpdater = vi.fn<() => void>();
        const secondUpdater = vi.fn<() => void>();
        mocks.subscribe.mockImplementation((_key, listener) => {
            subscribedListener = listener;
            return () => {};
        });

        registerAddFitOverlayButtonAvailabilityUpdater(firstUpdater);
        registerAddFitOverlayButtonAvailabilityUpdater(secondUpdater);
        subscribedListener?.();

        expect(mocks.subscribe).toHaveBeenCalledExactlyOnceWith(
            "fitFile.rawData",
            expect.any(Function)
        );
        expect(firstUpdater).not.toHaveBeenCalled();
        expect(secondUpdater).toHaveBeenCalledOnce();
        expect(subscribedListener).toBeDefined();
    });

    it("unsubscribes when reset for tests", () => {
        expect.assertions(1);

        let unsubscribed = false;
        mocks.subscribe.mockReturnValue(() => {
            unsubscribed = true;
        });

        registerAddFitOverlayButtonAvailabilityUpdater(() => {});
        resetAddFitOverlayButtonStateForTests();

        expect(unsubscribed).toBe(true);
    });
});
