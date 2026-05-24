import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

import type {
    DevtoolsInjectMenuFitFilePath,
    DevtoolsInjectMenuTheme,
    DevtoolsInvokeChannel,
} from "../../shared/ipc";

interface DevtoolsMenuApiModule {
    createDevtoolsMenuApi: (options: Record<string, unknown>) => {
        injectMenu: (
            theme?: DevtoolsInjectMenuTheme,
            fitFilePath?: DevtoolsInjectMenuFitFilePath
        ) => Promise<boolean>;
    };
}

const requireFromTest = createRequire(import.meta.url);
const { createDevtoolsMenuApi } = requireFromTest(
    "../../preload/devtoolsMenuApi.js"
) as DevtoolsMenuApiModule;

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

        const result = await api.injectMenu("dark", "activity.fit");

        expect(result ? "injected" : "skipped").toBe("injected");
        expect(invoke).toHaveBeenCalledWith(
            "devtools-inject-menu",
            "dark",
            "activity.fit"
        );
        expect(preloadLog).not.toHaveBeenCalled();
    });

    it("uses null defaults when no values are supplied", async () => {
        expect.assertions(2);

        const { api, invoke } = createApi();
        invoke.mockResolvedValueOnce(true);

        const result = await api.injectMenu();

        expect(result ? "injected" : "skipped").toBe("injected");
        expect(invoke).toHaveBeenCalledWith(
            "devtools-inject-menu",
            null,
            null
        );
    });

    it("rejects invalid values before invoking IPC", async () => {
        expect.assertions(4);

        const { api, invoke } = createApi();

        const invalidThemeResult = await api.injectMenu(123 as never, null);
        const invalidPathResult = await api.injectMenu("dark", 123 as never);

        expect(invalidThemeResult ? "injected" : "skipped").toBe("skipped");
        expect(invalidPathResult ? "injected" : "skipped").toBe("skipped");
        expect(invoke).not.toHaveBeenCalled();

        invoke.mockResolvedValueOnce(false);
        const validCallResult = await api.injectMenu("dark", "activity.fit");

        expect(validCallResult ? "injected" : "skipped").toBe("skipped");
    });

    it("logs IPC failures and resolves false", async () => {
        expect.assertions(3);

        const { api, invoke, preloadLog } = createApi();
        invoke.mockRejectedValueOnce(new Error("inject failed"));

        const result = await api.injectMenu("dark", null);

        expect(result ? "injected" : "skipped").toBe("skipped");
        expect(preloadLog).toHaveBeenCalledWith(
            "error",
            "[preload.js] Error in injectMenu:",
            expect.any(Error)
        );
        expect(invoke).toHaveBeenCalledWith("devtools-inject-menu", "dark", null);
    });
});
