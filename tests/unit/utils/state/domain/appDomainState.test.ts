import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    getAppDomainState,
    subscribeAppDomain,
} from "../../../../../electron-app/utils/state/domain/appDomainState.js";
import {
    appState,
    setState,
} from "../../../../../electron-app/utils/state/domain/appState.js";

describe("appDomainState renderer facade", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockReturnValue(undefined);
        appState.reset();
    });

    it("reads and subscribes through the app-domain state facade", () => {
        expect.assertions(2);

        const listener = vi.fn();
        const unsubscribe = subscribeAppDomain(
            "ui.activeTab-changed",
            listener
        );

        setState("ui.activeTab", "map");

        expect(getAppDomainState("ui.activeTab")).toBe("map");
        expect(listener).toHaveBeenCalledWith({
            newValue: "map",
            oldValue: "summary",
            path: "ui.activeTab",
            timestamp: expect.any(Number),
        });

        unsubscribe();
    });
});
