import { afterEach, describe, expect, it } from "vitest";

import {
    getProcessArgumentValues,
    getProcessCurrentWorkingDirectory,
    getProcessEnvironmentValue,
    getProcessStringValue,
    getProcessVersionValue,
    getRuntimeProcess,
    isDevelopmentEnvironment,
    isNodeEnvironment,
    isTestEnvironment,
    setRuntimeProcess,
} from "../../../electron-app/utils/runtime/processEnvironment.js";

const originalProcessDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "process"
);
if (!originalProcessDescriptor) {
    throw new Error("Expected globalThis.process descriptor to exist");
}

function setGlobalProcess(value: unknown): void {
    Object.defineProperty(globalThis, "process", {
        configurable: true,
        value,
        writable: true,
    });
}

function getNodeEnvironmentSnapshot(): {
    isDevelopment: boolean;
    isNodeTest: boolean;
    isTest: boolean;
    nodeEnv: string | undefined;
} {
    return {
        isDevelopment: isDevelopmentEnvironment(),
        isNodeTest: isNodeEnvironment("test"),
        isTest: isTestEnvironment(),
        nodeEnv: getProcessEnvironmentValue("NODE_ENV"),
    };
}

describe("process environment runtime boundary", () => {
    afterEach(() => {
        Object.defineProperty(globalThis, "process", originalProcessDescriptor);
    });

    it("returns undefined when process is missing", () => {
        expect.assertions(1);

        setGlobalProcess(undefined);

        expect(getNodeEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: false,
            isNodeTest: false,
            isTest: false,
            nodeEnv: undefined,
        });
    });

    it("returns undefined when process.env is missing", () => {
        expect.assertions(1);

        setGlobalProcess({});

        expect(getNodeEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: false,
            isNodeTest: false,
            isTest: false,
            nodeEnv: undefined,
        });
    });

    it("returns undefined when process.env is malformed", () => {
        expect.assertions(1);

        setGlobalProcess({ env: "test" });

        expect(getNodeEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: false,
            isNodeTest: false,
            isTest: false,
            nodeEnv: undefined,
        });
    });

    it("returns undefined when the process accessor throws", () => {
        expect.assertions(1);

        Object.defineProperty(globalThis, "process", {
            configurable: true,
            get() {
                throw new Error("process unavailable");
            },
        });

        expect(getNodeEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: false,
            isNodeTest: false,
            isTest: false,
            nodeEnv: undefined,
        });
    });

    it("returns undefined when the process.env accessor throws", () => {
        expect.assertions(1);

        setGlobalProcess(
            Object.defineProperty({}, "env", {
                configurable: true,
                get() {
                    throw new Error("env unavailable");
                },
            })
        );

        expect(getNodeEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: false,
            isNodeTest: false,
            isTest: false,
            nodeEnv: undefined,
        });
    });

    it("returns undefined when an environment value accessor throws", () => {
        expect.assertions(1);

        setGlobalProcess({
            env: new Proxy(
                {},
                {
                    get() {
                        throw new Error("value unavailable");
                    },
                }
            ),
        });

        expect(getNodeEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: false,
            isNodeTest: false,
            isTest: false,
            nodeEnv: undefined,
        });
    });

    it("reads string environment values only", () => {
        expect.assertions(2);

        setGlobalProcess({
            env: {
                FFV_DEBUG_MENU: 1,
                NODE_ENV: "development",
            },
        });

        expect({
            debugMenu: getProcessEnvironmentValue("FFV_DEBUG_MENU"),
            snapshot: getNodeEnvironmentSnapshot(),
        }).toStrictEqual({
            debugMenu: undefined,
            snapshot: {
                isDevelopment: true,
                isNodeTest: false,
                isTest: false,
                nodeEnv: "development",
            },
        });

        setGlobalProcess({ env: { NODE_ENV: "test" } });

        expect(getNodeEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: false,
            isNodeTest: true,
            isTest: true,
            nodeEnv: "test",
        });
    });

    it("reads string process arguments only", () => {
        expect.assertions(3);

        setGlobalProcess({
            argv: ["node", "app.js", "--dev", 42, null],
        });

        expect(getProcessArgumentValues()).toStrictEqual([
            "node",
            "app.js",
            "--dev",
        ]);

        setGlobalProcess({ argv: "--dev" });

        expect(getProcessArgumentValues()).toStrictEqual([]);

        setGlobalProcess(
            Object.defineProperty({}, "argv", {
                configurable: true,
                get() {
                    throw new Error("argv unavailable");
                },
            })
        );

        expect(getProcessArgumentValues()).toStrictEqual([]);
    });

    it("reads string process properties only", () => {
        expect.assertions(3);

        setGlobalProcess({
            arch: 123,
            platform: "win32",
            resourcesPath: "C:/mock/resources",
        });

        expect(getProcessStringValue("platform")).toBe("win32");
        expect(getProcessStringValue("resourcesPath")).toBe(
            "C:/mock/resources"
        );
        expect(getProcessStringValue("arch")).toBeUndefined();
    });

    it("reads string process version values only", () => {
        expect.assertions(3);

        setGlobalProcess({
            versions: {
                chrome: "120.0.0",
                electron: 1,
                node: "22.0.0",
            },
        });

        expect(getProcessVersionValue("chrome")).toBe("120.0.0");
        expect(getProcessVersionValue("node")).toBe("22.0.0");
        expect(getProcessVersionValue("electron")).toBeUndefined();
    });

    it("reads the process current working directory defensively", () => {
        expect.assertions(3);

        setGlobalProcess({ cwd: () => "C:/repo" });

        expect(getProcessCurrentWorkingDirectory()).toBe("C:/repo");

        setGlobalProcess({ cwd: "C:/repo" });

        expect(getProcessCurrentWorkingDirectory()).toBeUndefined();

        setGlobalProcess({
            cwd() {
                throw new Error("cwd unavailable");
            },
        });

        expect(getProcessCurrentWorkingDirectory()).toBeUndefined();
    });

    it("gets and sets the runtime process through the shared boundary", () => {
        expect.assertions(2);

        const processShim = { env: { NODE_ENV: "test" } };

        setRuntimeProcess(processShim);

        expect(getRuntimeProcess()).toBe(processShim);
        expect(getProcessEnvironmentValue("NODE_ENV")).toBe("test");
    });

    it("ignores runtime process writes when the global process setter throws", () => {
        expect.assertions(2);

        Object.defineProperty(globalThis, "process", {
            configurable: true,
            get() {
                return undefined;
            },
            set() {
                throw new Error("process is read-only");
            },
        });

        expect(() => {
            setRuntimeProcess({ env: { NODE_ENV: "test" } });
        }).not.toThrow();
        expect(getRuntimeProcess()).toBeUndefined();
    });
});
