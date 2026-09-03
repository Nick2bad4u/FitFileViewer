import prettierConfig from "prettier-config-nick2bad4u";

const overrides = (prettierConfig.overrides ?? []).map((override) => {
    if (override.options?.parser !== "yaml") {
        return override;
    }

    return {
        ...override,
        options: {
            endOfLine: "lf",
            parser: "yaml",
            printWidth: 1000,
            proseWrap: "preserve",
            tabWidth: 4,
            useTabs: false,
        },
    };
});

/** @type {import("prettier").Config} */
const localConfig = {
    ...prettierConfig,
    overrides,
};

export default localConfig;
