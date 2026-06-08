{
    type DevtoolsInjectMenuFitFilePath =
        import("./ipc").DevtoolsInjectMenuFitFilePath;
    type DevtoolsInjectMenuTheme = import("./ipc").DevtoolsInjectMenuTheme;

    const { validateFitFilePathInput } = require("./fitFilePathPolicy") as {
        validateFitFilePathInput: (filePath: unknown) => string;
    };

    const allowedDevtoolsThemes: ReadonlySet<string> = new Set([
        "auto",
        "dark",
        "light",
    ]);

    interface ValidatedDevtoolsInjectMenuPayload {
        fitFilePath: DevtoolsInjectMenuFitFilePath;
        theme: DevtoolsInjectMenuTheme;
    }

    function validateDevtoolsInjectMenuFitFilePath(
        fitFilePath: unknown
    ): DevtoolsInjectMenuFitFilePath {
        if (fitFilePath === null || fitFilePath === undefined) {
            return null;
        }

        if (typeof fitFilePath !== "string" || !fitFilePath.trim()) {
            throw new TypeError("Invalid devtools menu FIT file path provided");
        }

        try {
            return validateFitFilePathInput(fitFilePath);
        } catch (error) {
            throw new TypeError(
                "Invalid devtools menu FIT file path provided",
                {
                    cause: error,
                }
            );
        }
    }

    function validateDevtoolsInjectMenuTheme(
        theme: unknown
    ): DevtoolsInjectMenuTheme {
        if (theme === null || theme === undefined) {
            return null;
        }

        if (typeof theme !== "string" || !theme.trim()) {
            throw new TypeError("Invalid devtools menu theme provided");
        }

        const normalized = theme.trim().toLowerCase();
        const themeName = normalized === "system" ? "auto" : normalized;
        if (!allowedDevtoolsThemes.has(themeName)) {
            throw new TypeError("Invalid devtools menu theme provided");
        }

        return themeName;
    }

    function validateDevtoolsInjectMenuPayload(
        theme: unknown,
        fitFilePath: unknown
    ): ValidatedDevtoolsInjectMenuPayload {
        return {
            fitFilePath: validateDevtoolsInjectMenuFitFilePath(fitFilePath),
            theme: validateDevtoolsInjectMenuTheme(theme),
        };
    }

    module.exports = {
        validateDevtoolsInjectMenuFitFilePath,
        validateDevtoolsInjectMenuPayload,
        validateDevtoolsInjectMenuTheme,
    };
}
