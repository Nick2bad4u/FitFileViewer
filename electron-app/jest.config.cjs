/**
 * Minimal Jest config to enable VS Code Jest extension without interfering with Vitest.
 * It limits Jest to only run placeholder tests under tests/jest-placeholder/.
 */

const config = {
    testMatch: ["<rootDir>/tests/jest-placeholder/**/*.jest.test.js"],
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/tests/jest-placeholder/jest.setup.js"],
    transform: {},
    moduleFileExtensions: ["js", "json"],
    rootDir: ".",
    verbose: false,
    collectCoverage: false,
};

module.exports = config;
