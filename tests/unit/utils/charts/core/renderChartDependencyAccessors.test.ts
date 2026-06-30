import { describe, expect, it } from "vitest";

import {
    getSettingsStateManagerSafe,
    getUIStateManagerMaybe,
} from "../../../../../electron-app/utils/charts/core/renderChartDependencyAccessors.js";

describe("renderChartDependencyAccessors", () => {
    it("keeps the optional UI state manager unavailable by default", () => {
        expect.assertions(1);

        expect(getUIStateManagerMaybe()).toBeNull();
    });

    it("returns the typed settings manager adapter", () => {
        expect.assertions(3);

        const settingsManager = getSettingsStateManagerSafe();

        expect(settingsManager.getChartSettings).toBeTypeOf("function");
        expect(settingsManager.setChartFieldVisibility).toBeTypeOf("function");
        expect(settingsManager.updateChartSettings).toBeTypeOf("function");
    });
});
