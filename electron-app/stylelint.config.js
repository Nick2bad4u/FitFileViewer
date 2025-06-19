/** @type {import('stylelint').Config} */
module.exports = {
    extends: "stylelint-config-standard",
    rules: {
        "block-no-empty": true,
        "media-feature-range-notation": null,
        "selector-id-pattern": null, // Ignore kebab-case enforcement for IDs
    },
};
