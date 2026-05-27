import sharedConfig from "stylelint-config-nick2bad4u";

/** @type {import("stylelint").Config} */
const stylelintConfig = {
    ...sharedConfig,
    ignoreFiles: [
        "**/node_modules/**",
        "electron-app/coverage/**",
        "electron-app/dist/**",
        "electron-app/release/**",
        "electron-app/temp-win7/**",
        "electron-app/test-results/**",
        "static/ffv/assets/**",
    ],
    reportNeedlessDisables: false,
};

export default stylelintConfig;
