import sharedConfig from "stylelint-config-nick2bad4u";

/** @type {import("stylelint").Config} */
const stylelintConfig = {
    ...sharedConfig,
    ignoreFiles: [
        "**/node_modules/**",
        "dist/**",
        "static/ffv/assets/**",
    ],
    reportNeedlessDisables: false,
};

export default stylelintConfig;
