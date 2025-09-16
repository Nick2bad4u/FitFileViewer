/**
 * Jest configuration for VS Code Jest extension integration.
 *
 * Notes:
 * - This project uses Vitest as the primary test runner (see electron-app/vitest.config.js).
 * - VS Code Jest extension requires a jest.config.* file to discover tests and enable gutter run/debug.
 * - This config provides a minimal, non-conflicting setup pointing Jest at a tiny placeholder suite,
 *   so the extension can activate without interfering with Vitest.
 *
 * Usage:
 * - Keep using Vitest to run the real test suite (npm --prefix electron-app test).
 * - VS Code Jest extension will activate with this config, but tests shown are limited to the placeholder.
 * - For full integration with VS Code, prefer the official Vitest VS Code extension.
 */

module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/electron-app/tests/jest-placeholder'],
    testMatch: ['**/*.jest.test.(js|ts)'],
    setupFilesAfterEnv: ['<rootDir>/electron-app/tests/jest-placeholder/jest.setup.js'],
    transform: {},
    moduleFileExtensions: ['js', 'ts', 'json'],
    // Keep it isolated so Jest doesn't try to run the Vitest suites
    testPathIgnorePatterns: ['/node_modules/', '/electron-app/tests/(?!jest-placeholder)/'],
    // Silence verbose logs from Electron-mocked globals if any
    verbose: false,
};
