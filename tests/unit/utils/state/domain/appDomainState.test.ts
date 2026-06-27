import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    getAppDomainState,
    getAppStartTime,
    subscribeAppDomain,
    subscribeAppDomainPath,
    subscribeToAppOpeningFile,
} from "../../../../../electron-app/utils/state/domain/appDomainState.js";
import {
    resetState,
    setState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

describe("appDomainState renderer facade", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockReturnValue(undefined);
        resetState();
    });

    it("reads app startup time through the explicit lifecycle getter", () => {
        expect.assertions(2);

        setState("app.startTime", 123, { source: "test" });

        const startTime = getAppStartTime();

        expect(startTime).toBe(123);

        setState("app.startTime", null, { source: "test" });

        expect(getAppStartTime()).toBeNull();
    });

    it("reads and subscribes through the app-domain state facade", () => {
        expect.assertions(2);

        let receivedEvent: unknown;
        const unsubscribe = subscribeAppDomain(
            "ui.activeTab-changed",
            (event) => {
                receivedEvent = event;
            }
        );

        setState("ui.activeTab", "map", { source: "test" });

        expect(getAppDomainState("ui.activeTab")).toBe("map");
        expect(receivedEvent).toStrictEqual({
            newValue: "map",
            oldValue: "summary",
            path: "ui.activeTab",
            timestamp: expect.any(Number),
        });

        unsubscribe();
    });

    it("subscribes to centralized app-domain state paths", () => {
        expect.assertions(2);

        let callCount = 0;
        let latestValue: unknown;
        function listener(value: unknown): void {
            callCount += 1;
            latestValue = value;
        }
        const unsubscribe = subscribeAppDomainPath(
            "app.isOpeningFile",
            listener
        );

        setState("app.isOpeningFile", true, { source: "test" });

        expect({ callCount, latestValue }).toStrictEqual({
            callCount: 1,
            latestValue: true,
        });

        unsubscribe();
        setState("app.isOpeningFile", false, { source: "test" });

        expect({ callCount, latestValue }).toStrictEqual({
            callCount: 1,
            latestValue: true,
        });
    });

    it("subscribes to file-opening state through the explicit lifecycle facade", () => {
        expect.assertions(2);

        let latestValue: unknown;
        const unsubscribe = subscribeToAppOpeningFile((value) => {
            latestValue = value;
        });

        setState("app.isOpeningFile", true, { source: "test" });

        expect(latestValue).toBe(true);

        unsubscribe();
        setState("app.isOpeningFile", false, { source: "test" });

        expect(latestValue).toBe(true);
    });
});
