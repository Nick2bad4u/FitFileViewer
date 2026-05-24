// eslint-disable-next-line n/no-unpublished-import -- Stylelint loads this local tooling config from devDependencies.
import sharedConfig from "stylelint-config-nick2bad4u";

/** @type {import("stylelint").Config} */
const stylelintConfig = {
    ...sharedConfig,
    ignoreFiles: ["vendor/**/*.css"],
};

export default stylelintConfig;
