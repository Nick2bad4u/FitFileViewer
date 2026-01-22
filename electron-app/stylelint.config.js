/** @type {import('stylelint').Config} */
module.exports = {
    extends: "stylelint-config-standard",
    ignoreFiles: [
        // Bundled/build output (generated). Linting these produces noisy violations and is not actionable.
        "ffv/assets/**/*.css",
        "html/assets/**/*.css",
        // Packaged/build output (generated).
        "dist/**/*.css",
        "dist/**",
        // Win7 build staging output (generated).
        "temp-win7/**",
        // Coverage reports (generated).
        "coverage/**/*.css",
    ],
    rules: {
        "block-no-empty": true,
        "media-feature-range-notation": null,
        "selector-id-pattern": null, // Ignore kebab-case enforcement for IDs
    },
    overrides: [
        {
            files: ["style.css"],
            rules: {
                // This file is a large, historical stylesheet with intentional repetition and
                // legacy patterns. Enforcing the full standard ruleset here creates thousands
                // of noisy violations that are not worth refactoring right now.
                // Keep stylelint useful for smaller/modern CSS files.
                "alpha-value-notation": null,
                "color-function-alias-notation": null,
                "color-function-notation": null,
                "comment-empty-line-before": null,
                "custom-property-empty-line-before": null,
                "declaration-block-no-redundant-longhand-properties": null,
                "declaration-property-value-keyword-no-deprecated": null,
                "no-duplicate-selectors": null,
                "property-no-vendor-prefix": null,
                "rule-empty-line-before": null,
                "shorthand-property-no-redundant-values": null,
                "value-keyword-case": null,
            },
        },
    ],
};
