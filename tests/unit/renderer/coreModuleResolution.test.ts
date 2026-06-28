import { afterEach, describe, expect, it, vi } from "vitest";

import {
    resetRendererCoreModuleTestOverrides,
    resolveExactRendererCoreTestOverride,
    resolveRendererCoreTestOverride,
    setRendererCoreModuleTestOverrides,
} from "../../../electron-app/renderer/coreModuleResolution.js";

function setTestOverrideRegistry(registry: Map<string, unknown>): void {
    setRendererCoreModuleTestOverrides(registry);
}

describe("renderer core module resolution", () => {
    afterEach(() => {
        resetRendererCoreModuleTestOverrides();
        vi.restoreAllMocks();
    });

    it("resolves exact and suffix-matched test overrides", () => {
        expect.assertions(3);

        const exactMock = { default: { exact: true } };
        const suffixMock = { suffix: true };
        setTestOverrideRegistry(
            new Map<string, unknown>([
                ["../../utils/files/import/handleOpenFile.js", exactMock],
                [
                    "../../../electron-app/utils/theming/core/theme.js",
                    suffixMock,
                ],
            ])
        );

        expect(
            resolveExactRendererCoreTestOverride(
                "../../utils/files/import/handleOpenFile.js"
            )
        ).toStrictEqual({ exact: true });
        expect(
            resolveRendererCoreTestOverride("/utils/theming/core/theme.js")
        ).toStrictEqual(suffixMock);
        expect(resolveRendererCoreTestOverride("/utils/missing.js")).toBeNull();
    });
});
