type DevtoolsInjectMenuFitFilePath =
    import("../shared/ipc").DevtoolsInjectMenuFitFilePath;
type DevtoolsInjectMenuResponse =
    import("../shared/ipc").DevtoolsInjectMenuResponse;
type DevtoolsInjectMenuTheme = import("../shared/ipc").DevtoolsInjectMenuTheme;
type ValidatedDevtoolsInjectMenuPayload = {
    fitFilePath: DevtoolsInjectMenuFitFilePath;
    theme: DevtoolsInjectMenuTheme;
};
type DevtoolsMenuApi = import("../shared/preloadApi").ElectronDevtoolsMenuApi;
type CreateDevtoolsMenuApiOptions =
    import("./preloadModuleTypes").CreateDevtoolsMenuApiOptions;

export function createDevtoolsMenuApi({
    defaultFitFilePath,
    defaultTheme,
    devtoolsInjectMenuChannel,
    ipcRenderer,
    preloadLog,
    validateDevtoolsInjectMenuPayload,
}: CreateDevtoolsMenuApiOptions): DevtoolsMenuApi {
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
            if (typeof ipcRenderer?.invoke !== "function") {
                throw new TypeError("ipcRenderer.invoke unavailable");
            }
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
