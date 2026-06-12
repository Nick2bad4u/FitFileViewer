import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererCoreStateManager as getCoreStateManager,
    getRendererCoreSubscribeSingleton as getCoreSubscribeSingleton,
    toRendererStateManagerAccess as toStateManagerAccess,
} from "../../../../../electron-app/utils/state/domain/rendererStateManagerAccess.js";

describe("rendererStateManagerAccess", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("exposes the renderer core state manager through a typed adapter", () => {
        expect.assertions(2);

        const access = getCoreStateManager();
        access?.setState("ui.activeTab", "map", { source: "test" });

        expect(access).toBeDefined();
        expect(access?.getState("ui.activeTab")).toBe("map");
    });

    it("normalizes only complete state manager candidates", () => {
        expect.assertions(3);

        const candidate = {
            getState: () => "summary",
            setState: () => undefined,
            subscribe: () => undefined,
        };

        expect(toStateManagerAccess(candidate)).toEqual(candidate);
        expect(
            toStateManagerAccess({ getState: () => "summary" })
        ).toBeUndefined();
        expect(toStateManagerAccess(null)).toBeUndefined();
    });

    it("exposes the singleton subscription function", () => {
        expect.assertions(2);

        const subscribeSingleton = getCoreSubscribeSingleton();
        const listener = () => undefined;
        const unsubscribe = subscribeSingleton?.(
            "ui.activeTab",
            "rendererStateManagerAccess.test",
            listener
        );

        expect(subscribeSingleton).toBeTypeOf("function");
        expect(unsubscribe).toBeTypeOf("function");

        unsubscribe?.();
    });
});
