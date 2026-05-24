import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type JestPlaceholderConfig = {
    testMatch: string[];
    transform: Record<string, never>;
};

const require = createRequire(import.meta.url),
    jestConfig = require("../../jest.config.cjs") as JestPlaceholderConfig;

describe("Jest placeholder smoke test", () => {
    it("limits Jest discovery to placeholder JavaScript tests", () => {
        expect(jestConfig.testMatch).toEqual([
            "<rootDir>/tests/jest-placeholder/**/*.jest.test.js",
        ]);
        expect(jestConfig.testMatch).not.toContain(
            "<rootDir>/**/*.jest.test.ts"
        );
        expect(jestConfig.transform).toEqual({});
    });
});
