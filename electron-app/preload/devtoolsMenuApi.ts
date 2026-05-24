{
    type DevtoolsInjectMenuFitFilePath =
        import("../shared/ipc").DevtoolsInjectMenuFitFilePath;
    type DevtoolsInjectMenuResponse =
        import("../shared/ipc").DevtoolsInjectMenuResponse;
    type DevtoolsInjectMenuTheme =
        import("../shared/ipc").DevtoolsInjectMenuTheme;
    type DevtoolsInvokeChannel = import("../shared/ipc").DevtoolsInvokeChannel;

    type PreloadLog = (
        level: "error" | "info" | "warn",
        message: string,
        ...details: unknown[]
    ) => void;

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
        validateOptionalNonEmptyString: (
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
        validateOptionalNonEmptyString,
    }: DevtoolsMenuApiOptions): DevtoolsMenuApi {
        async function injectMenu(
            theme: DevtoolsInjectMenuTheme = defaultTheme,
            fitFilePath: DevtoolsInjectMenuFitFilePath = defaultFitFilePath
        ): Promise<DevtoolsInjectMenuResponse> {
            if (!validateOptionalNonEmptyString(theme, "theme", "injectMenu")) {
                return false;
            }
            if (
                !validateOptionalNonEmptyString(
                    fitFilePath,
                    "fitFilePath",
                    "injectMenu"
                )
            ) {
                return false;
            }

            try {
                return (await ipcRenderer.invoke(
                    devtoolsInjectMenuChannel,
                    theme,
                    fitFilePath
                )) as DevtoolsInjectMenuResponse;
            } catch (error) {
                preloadLog(
                    "error",
                    "[preload.js] Error in injectMenu:",
                    error
                );
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
