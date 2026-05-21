const sharedConfig = require("secretlint-config-nick2bad4u/secretlintrc.json");

/** @type {import("@secretlint/types").SecretLintConfigDescriptor} */
const secretlintConfig = {
    ...sharedConfig,
    rules: [...sharedConfig.rules],
};

module.exports = secretlintConfig;
