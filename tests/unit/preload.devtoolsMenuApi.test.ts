import { describe, expect, it, vi } from "vitest";

import type {
    DevtoolsInjectMenuFitFilePath,
    DevtoolsInjectMenuTheme,
    DevtoolsInvokeChannel,
} from "../../electron-app/shared/ipc";
import { createDevtoolsMenuApi } from "../../electron-app/preload/devtoolsMenuApi.js";
import { validateDevtoolsInjectMenuPayload } from "../../electron-app/shared/devtoolsMenuPolicy.js";

function createApi() {
    const invoke =
        vi.fn<
            (
                channel: DevtoolsInvokeChannel,
                theme: DevtoolsInjectMenuTheme,
                fitFilePath: DevtoolsInjectMenuFitFilePath
            ) => Promise<unknown>
        >();
    const preloadLog =
        vi.fn<
            (
                level: "error" | "info" | "warn",
                message: string,
                ...details: unknown[]
            ) => void
        >();

    return {
        api: createDevtoolsMenuApi({
            defaultFitFilePath: null,
            defaultTheme: null,
            devtoolsInjectMenuChannel: "devtools-inject-menu",
            ipcRenderer: { invoke },
            preloadLog,
            validateDevtoolsInjectMenuPayload,
            validateOptionalNonEmptyString: (
                value: unknown
            ): value is null | string | undefined =>
                value === null ||
                value === undefined ||
                (typeof value === "string" && value.trim().length > 0),
        }),
        invoke,
        preloadLog,
    };
}

describe("preload devtools menu API", () => {
    it("invokes menu injection with explicit values", async () => {
        expect.assertions(3);

        const { api, invoke, preloadLog } = createApi();
        invoke.mockResolvedValueOnce(true);

        const result = await api.injectMenu("dark", "C:/rides/activity.fit");

        expect({ injected: result }).toStrictEqual({ injected: true });
        expect(invoke).toHaveBeenCalledWith(
            "devtools-inject-menu",
            "dark",
            "C:/rides/activity.fit"
        );
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("normalizes system theme before invoking IPC", async () => {
        expect.assertions(2);

        const { api, invoke } = createApi();
        invoke.mockResolvedValueOnce(true);

        const result = await api.injectMenu("system", null);

        expect({ injected: result }).toStrictEqual({ injected: true });
        expect(invoke).toHaveBeenCalledWith(
            "devtools-inject-menu",
            "auto",
            null
        );
    });

    it("uses null defaults when no values are supplied", async () => {
        expect.assertions(2);

        const { api, invoke } = createApi();
        invoke.mockResolvedValueOnce(true);

        const result = await api.injectMenu();

        expect({ injected: result }).toStrictEqual({ injected: true });
        expect(invoke).toHaveBeenCalledWith("devtools-inject-menu", null, null);
    });

    it("rejects invalid values before invoking IPC", async () => {
        expect.assertions(3);

        const { api, invoke } = createApi();

        const invalidThemeResult = await api.injectMenu(123 as never, null);
        const invalidPathResult = await api.injectMenu("dark", 123 as never);
        const invalidRelativePathResult = await api.injectMenu(
            "dark",
            "activity.fit"
        );
        const invalidThemeNameResult = await api.injectMenu("solarized", null);

        expect({
            invalidRelativePathResult,
            invalidPathResult,
            invalidThemeNameResult,
            invalidThemeResult,
        }).toStrictEqual({
            invalidRelativePathResult: false,
            invalidPathResult: false,
            invalidThemeNameResult: false,
            invalidThemeResult: false,
        });
        expect(invoke).not.toHaveBeenCalled();

        invoke.mockResolvedValueOnce(false);
        const validCallResult = await api.injectMenu(
            "dark",
            "C:/rides/activity.fit"
        );

        expect({ validCallResult }).toStrictEqual({ validCallResult: false });
    });

    it("logs IPC failures and resolves false", async () => {
        expect.assertions(3);

        const { api, invoke, preloadLog } = createApi();
        const injectError = new Error("inject failed");
        invoke.mockRejectedValueOnce(injectError);

        const result = await api.injectMenu("dark", null);

        expect({ injected: result }).toStrictEqual({ injected: false });
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Error in injectMenu:",
            injectError
        );
        expect(invoke).toHaveBeenCalledWith(
            "devtools-inject-menu",
            "dark",
            null
        );
    });
});
