import sharedConfig from "stylelint-config-nick2bad4u";

/** @type {import("stylelint").Config} */
const stylelintConfig = {
    ...sharedConfig,
    ignoreFiles: [
        "**/node_modules/**",
        "electron-app/coverage/**",
        "electron-app/dist/**",
        "electron-app/ffv/assets/**",
        "electron-app/html/**",
        "electron-app/release/**",
        "electron-app/temp-win7/**",
        "electron-app/test-results/**",
    ],
    reportNeedlessDisables: false,
};

export default stylelintConfig;
