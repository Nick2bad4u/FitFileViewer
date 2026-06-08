import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

interface DevtoolsMenuPolicyModule {
    validateDevtoolsInjectMenuFitFilePath: (value: unknown) => null | string;
    validateDevtoolsInjectMenuPayload: (
        theme: unknown,
        fitFilePath: unknown
    ) => {
        fitFilePath: null | string;
        theme: null | string;
    };
    validateDevtoolsInjectMenuTheme: (value: unknown) => null | string;
}

const requireFromTest = createRequire(import.meta.url);
const {
    validateDevtoolsInjectMenuFitFilePath,
    validateDevtoolsInjectMenuPayload,
    validateDevtoolsInjectMenuTheme,
} = requireFromTest(
    "../../electron-app/shared/devtoolsMenuPolicy.js"
) as DevtoolsMenuPolicyModule;

describe("devtools menu policy", () => {
    it("normalizes allowed themes and absolute FIT paths", () => {
        expect.assertions(5);

        expect(validateDevtoolsInjectMenuTheme(" DARK ")).toBe("dark");
        expect(validateDevtoolsInjectMenuTheme("system")).toBe("auto");
        expect(validateDevtoolsInjectMenuTheme(null)).toBeNull();
        expect(
            validateDevtoolsInjectMenuFitFilePath(" C:/rides/demo.fit ")
        ).toBe("C:/rides/demo.fit");
        expect(
            validateDevtoolsInjectMenuPayload("light", "C:/rides/demo.fit")
        ).toStrictEqual({
            fitFilePath: "C:/rides/demo.fit",
            theme: "light",
        });
    });

    it("rejects arbitrary themes and non-absolute paths", () => {
        expect.assertions(7);

        for (const theme of [
            "",
            "solarized",
            123,
        ]) {
            expect(() => validateDevtoolsInjectMenuTheme(theme)).toThrow(
                "Invalid devtools menu theme provided"
            );
        }

        for (const filePath of [
            "",
            "activity.fit",
            "file:///tmp/activity.fit",
            "C:/rides/\u0000bad.fit",
        ]) {
            expect(() =>
                validateDevtoolsInjectMenuFitFilePath(filePath)
            ).toThrow("Invalid devtools menu FIT file path provided");
        }
    });
});
