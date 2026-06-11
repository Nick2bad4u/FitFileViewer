import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    getAppDomainState,
    subscribeAppDomain,
    subscribeAppDomainPath,
} from "../../../../../electron-app/utils/state/domain/appDomainState.js";
import {
    appState,
    setState as setLegacyAppState,
} from "../../../../../electron-app/utils/state/domain/appState.js";
import {
    resetState,
    setState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

describe("appDomainState renderer facade", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockReturnValue(undefined);
        appState.reset();
        resetState();
    });

    it("reads and subscribes through the app-domain state facade", () => {
        expect.assertions(2);

        const listener = vi.fn();
        const unsubscribe = subscribeAppDomain(
            "ui.activeTab-changed",
            listener
        );

        setLegacyAppState("ui.activeTab", "map");

        expect(getAppDomainState("ui.activeTab")).toBe("map");
        expect(listener).toHaveBeenCalledWith({
            newValue: "map",
            oldValue: "summary",
            path: "ui.activeTab",
            timestamp: expect.any(Number),
        });

        unsubscribe();
    });

    it("subscribes to centralized app-domain state paths", () => {
        expect.assertions(2);

        const listener = vi.fn();
        const unsubscribe = subscribeAppDomainPath("app.isOpeningFile", listener);

        setState("app.isOpeningFile", true, { source: "test" });

        expect(listener).toHaveBeenCalledWith(
            true,
            undefined,
            "app.isOpeningFile"
        );

        unsubscribe();
        setState("app.isOpeningFile", false, { source: "test" });

        expect(listener).toHaveBeenCalledOnce();
    });
});
