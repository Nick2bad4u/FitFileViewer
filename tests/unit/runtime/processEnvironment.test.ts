import { afterEach, describe, expect, it } from "vitest";

import {
    getProcessEnvironmentValue,
    isDevelopmentEnvironment,
    isNodeEnvironment,
    isTestEnvironment,
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
});
