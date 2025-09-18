/**
 * Minimal Jest config to enable VS Code Jest extension without interfering with Vitest.
 * It limits Jest to only run placeholder tests under tests/jest-placeholder/.
 */

const config = {
    collectCoverage: false,
    moduleFileExtensions: ["js", "json"],
    rootDir: ".",
    setupFilesAfterEnv: ["<rootDir>/tests/jest-placeholder/jest.setup.js"],
    testEnvironment: "node",
    testMatch: ["<rootDir>/tests/jest-placeholder/**/*.jest.test.js"],
    transform: {},
    verbose: false,
};

module.exports = config;
