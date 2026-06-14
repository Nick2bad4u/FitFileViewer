import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    clearCurrentNotification,
    getCurrentRendererNotification,
    normalizeRendererNotification,
    setCurrentRendererNotification,
    subscribeToCurrentRendererNotification as subscribeToCurrentNotification,
} from "../../../../../electron-app/utils/state/domain/rendererNotificationState.js";

describe("rendererNotificationState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes current notification through typed helpers", () => {
        expect.assertions(2);

        expect(getCurrentRendererNotification()).toBeNull();

        setCurrentRendererNotification(
            {
                message: "Saved",
                timestamp: 123,
                type: "success",
            },
            { source: "test" }
        );

        expect(getCurrentRendererNotification()).toStrictEqual({
            message: "Saved",
            timestamp: 123,
            type: "success",
        });
    });

    it("clears current notification through the typed helper", () => {
        expect.assertions(1);

        setCurrentRendererNotification(
            {
                message: "Temporary",
                type: "info",
            },
            { source: "test" }
        );

        clearCurrentNotification({ source: "test" });

        expect(getCurrentRendererNotification()).toBeNull();
    });

    it("normalizes malformed notification state to null", () => {
        expect.assertions(3);

        expect(normalizeRendererNotification("bad")).toBeNull();
        expect(
            normalizeRendererNotification({ message: "Bad", type: "fatal" })
        ).toBeNull();
        expect(
            normalizeRendererNotification({
                message: "No timestamp needed",
                timestamp: "bad",
                type: "warning",
            })
        ).toStrictEqual({
            message: "No timestamp needed",
            type: "warning",
        });
    });

    it("subscribes with normalized notifications", () => {
        expect.assertions(2);

        const received: unknown[] = [];
        const unsubscribe = subscribeToCurrentNotification((notification) => {
            received.push(notification);
        });

        setCurrentRendererNotification(
            {
                message: "Loaded",
                type: "success",
            },
            { source: "test" }
        );
        stateManager.setState("ui.currentNotification", "bad", {
            source: "test",
        });
        unsubscribe();

        expect(received[0]).toStrictEqual({
            message: "Loaded",
            type: "success",
        });
        expect(received[1]).toBeNull();
    });
});
