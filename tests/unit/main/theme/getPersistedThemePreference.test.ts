// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CONSTANTS } from "../../../../electron-app/main/constants.js";
import { getPersistedThemePreference } from "../../../../electron-app/main/theme/getPersistedThemePreference.js";

const createElectronConfMock = vi.hoisted(() =>
    vi.fn<(options?: { name?: string }) => unknown>()
);

vi.mock("../../../../electron-app/main/runtime/electronConfAccess.js", () => ({
    createElectronConf: createElectronConfMock,
}));

describe("getPersistedThemePreference", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        createElectronConfMock.mockReset();
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it("reads the persisted theme from main-process settings without renderer JavaScript", async () => {
        expect.assertions(4);

        const get = vi.fn<(key: string, fallback: unknown) => unknown>(
            () => " LIGHT "
        );
        createElectronConfMock.mockReturnValue({ get });

        await expect(getPersistedThemePreference()).resolves.toBe("light");

        expect(createElectronConfMock).toHaveBeenCalledWith({
            name: CONSTANTS.SETTINGS_CONFIG_NAME,
        });
        expect(get).toHaveBeenCalledWith("theme", CONSTANTS.DEFAULT_THEME);
        expect(getPersistedThemePreference).toHaveLength(0);
    });

    it("normalizes the legacy system theme value to auto", async () => {
        expect.assertions(1);

        createElectronConfMock.mockReturnValue({
            get: () => "system",
        });

        await expect(getPersistedThemePreference()).resolves.toBe("auto");
    });

    it("falls back to the default theme for invalid persisted values", async () => {
        expect.assertions(1);

        createElectronConfMock.mockReturnValue({
            get: () => "neon",
        });

        await expect(getPersistedThemePreference()).resolves.toBe(
            CONSTANTS.DEFAULT_THEME
        );
    });

    it("falls back to the default theme when settings cannot be read", async () => {
        expect.assertions(2);

        createElectronConfMock.mockReturnValue({
            get: () => {
                throw new Error("settings locked");
            },
        });

        await expect(getPersistedThemePreference()).resolves.toBe(
            CONSTANTS.DEFAULT_THEME
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[main.js] Failed to get persisted theme:",
            expect.any(Error)
        );
    });
});
