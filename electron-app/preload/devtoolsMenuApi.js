"use strict";
{
    function createDevtoolsMenuApi({
        defaultFitFilePath,
        defaultTheme,
        devtoolsInjectMenuChannel,
        ipcRenderer,
        preloadLog,
        validateOptionalNonEmptyString,
    }) {
        async function injectMenu(
            theme = defaultTheme,
            fitFilePath = defaultFitFilePath
        ) {
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
                return await ipcRenderer.invoke(
                    devtoolsInjectMenuChannel,
                    theme,
                    fitFilePath
                );
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
