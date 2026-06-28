import { afterEach, describe, expect, it, vi } from "vitest";

import { getBrowserMainUiRuntimeEnvironmentScope } from "../../../electron-app/renderer/mainUiBrowserRuntime.js";
import {
    getMainUiRuntimeEnvironment,
    type MainUiRuntimeEnvironmentScope,
} from "../../../electron-app/renderer/mainUiRuntimeEnvironment.js";

describe("main UI runtime environment", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates the production browser scope explicitly", () => {
        expect.assertions(5);

        const before = Date.now();
        const runtimeEnvironment = getMainUiRuntimeEnvironment(
            getBrowserMainUiRuntimeEnvironmentScope()
        );
        const after = Date.now();
        const runtimeNow = runtimeEnvironment.dateNow();

        expect(runtimeEnvironment.consoleRef).toBe(console);
        expect(runtimeEnvironment.documentRef).toBe(document);
        expect(
            runtimeEnvironment.electronApiScope.getElectronAPI?.()
        ).toBeUndefined();
        expect(runtimeNow).toBeGreaterThanOrEqual(before);
        expect(runtimeNow).toBeLessThanOrEqual(after + 1000);
    });

    it("resolves the production browser electron API from the runtime scope", () => {
        expect.assertions(1);

        const electronApiFixture = {};

        vi.stubGlobal("electronAPI", electronApiFixture);

        const runtimeEnvironment = getMainUiRuntimeEnvironment(
            getBrowserMainUiRuntimeEnvironmentScope()
        );

        expect(runtimeEnvironment.electronApiScope.getElectronAPI?.()).toBe(
            electronApiFixture
        );
    });

    it("uses injected runtime primitives for main-ui orchestration", () => {
        expect.assertions(6);

        const runtimeConsole = {
            ...console,
            info: vi.fn<typeof console.info>(),
        } as Console;
        const documentRef = {
            readyState: "complete",
        } as unknown as Document;
        const dateNow = vi.fn<() => number>(() => 1234);
        const electronApiFixture = {};
        const replacementElectronApiFixture = {};
        const getElectronAPI = vi.fn(() => electronApiFixture);
        const runtimeEnvironment = getMainUiRuntimeEnvironment({
            dateNow,
            getConsole: () => runtimeConsole,
            getDocument: () => documentRef,
            getElectronAPI,
        });
        getElectronAPI.mockReturnValue(replacementElectronApiFixture);

        expect(runtimeEnvironment.consoleRef).toBe(runtimeConsole);
        expect(runtimeEnvironment.dateNow()).toBe(1234);
        expect(runtimeEnvironment.documentRef).toBe(documentRef);
        expect(runtimeEnvironment.electronApiScope.getElectronAPI?.()).toBe(
            electronApiFixture
        );
        expect(runtimeEnvironment.electronApiScope.getElectronAPI?.()).not.toBe(
            replacementElectronApiFixture
        );
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when an explicit runtime scope omits required primitives", () => {
        expect.assertions(3);

        expect(() => getMainUiRuntimeEnvironment({ dateNow: () => 1 })).toThrow(
            "main UI runtime environment requires a console reference"
        );
        expect(() =>
            getMainUiRuntimeEnvironment({ getConsole: () => console })
        ).toThrow("main UI runtime environment requires a clock");
        expect(() =>
            getMainUiRuntimeEnvironment({
                dateNow: () => 1,
                getConsole: () => console,
            })
        ).toThrow("main UI runtime environment requires a document reference");
    });

    it("ignores legacy direct console runtime properties", () => {
        expect.assertions(2);

        const documentRef = {
            readyState: "complete",
        } as unknown as Document;
        const legacyScope = {
            consoleRef: console,
            dateNow: () => 1,
        } as unknown as MainUiRuntimeEnvironmentScope;
        const legacyDocumentScope = {
            dateNow: () => 1,
            documentRef,
            getConsole: () => console,
        } as unknown as MainUiRuntimeEnvironmentScope;

        expect(() => getMainUiRuntimeEnvironment(legacyScope)).toThrow(
            "main UI runtime environment requires a console reference"
        );
        expect(() => getMainUiRuntimeEnvironment(legacyDocumentScope)).toThrow(
            "main UI runtime environment requires a document reference"
        );
    });
});
