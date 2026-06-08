{
    type DevtoolsInjectMenuFitFilePath =
        import("../shared/ipc").DevtoolsInjectMenuFitFilePath;
    type DevtoolsInjectMenuResponse =
        import("../shared/ipc").DevtoolsInjectMenuResponse;
    type DevtoolsInjectMenuTheme =
        import("../shared/ipc").DevtoolsInjectMenuTheme;
    type DevtoolsInvokeChannel = import("../shared/ipc").DevtoolsInvokeChannel;
    type ValidatedDevtoolsInjectMenuPayload = {
        fitFilePath: DevtoolsInjectMenuFitFilePath;
        theme: DevtoolsInjectMenuTheme;
    };

    type PreloadLog = (
        level: "error" | "info" | "warn",
        message: string,
        ...details: unknown[]
    ) => void;

    const { validateDevtoolsInjectMenuPayload } =
        require("../shared/devtoolsMenuPolicy") as {
            validateDevtoolsInjectMenuPayload: (
                theme: unknown,
                fitFilePath: unknown
            ) => ValidatedDevtoolsInjectMenuPayload;
        };

    interface DevtoolsMenuApi {
        injectMenu: (
            theme?: DevtoolsInjectMenuTheme,
            fitFilePath?: DevtoolsInjectMenuFitFilePath
        ) => Promise<DevtoolsInjectMenuResponse>;
    }

    interface DevtoolsMenuApiOptions {
        defaultFitFilePath: DevtoolsInjectMenuFitFilePath;
        defaultTheme: DevtoolsInjectMenuTheme;
        devtoolsInjectMenuChannel: DevtoolsInvokeChannel;
        ipcRenderer: {
            invoke: (
                channel: DevtoolsInvokeChannel,
                theme: DevtoolsInjectMenuTheme,
                fitFilePath: DevtoolsInjectMenuFitFilePath
            ) => Promise<unknown>;
        };
        preloadLog: PreloadLog;
        validateOptionalNonEmptyString?: (
            value: unknown,
            paramName: string,
            methodName: string
        ) => value is null | string | undefined;
    }

    function createDevtoolsMenuApi({
        defaultFitFilePath,
        defaultTheme,
        devtoolsInjectMenuChannel,
        ipcRenderer,
        preloadLog,
    }: DevtoolsMenuApiOptions): DevtoolsMenuApi {
        async function injectMenu(
            theme: DevtoolsInjectMenuTheme = defaultTheme,
            fitFilePath: DevtoolsInjectMenuFitFilePath = defaultFitFilePath
        ): Promise<DevtoolsInjectMenuResponse> {
            let payload: ValidatedDevtoolsInjectMenuPayload;
            try {
                payload = validateDevtoolsInjectMenuPayload(theme, fitFilePath);
            } catch {
                return false;
            }

            try {
                return (await ipcRenderer.invoke(
                    devtoolsInjectMenuChannel,
                    payload.theme,
                    payload.fitFilePath
                )) as DevtoolsInjectMenuResponse;
            } catch (error) {
                preloadLog("error", "[preload.js] Error in injectMenu:", error);
                return false;
            }
        }

        return {
            injectMenu,
        };
    }

    module.exports = {
        createDevtoolsMenuApi,
    };
}
