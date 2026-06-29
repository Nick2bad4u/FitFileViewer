// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
    getFileAccessPolicyRuntime,
    type FileAccessPolicyRuntimeScope,
} from "../../../../electron-app/main/security/fileAccessPolicyRuntime.js";

describe("fileAccessPolicyRuntime", () => {
    it("reads node environment checks through the provided scope", () => {
        expect.assertions(3);

        const isNodeEnvironment = vi.fn<(expected: string) => boolean>(
            (expected) => expected === "test"
        );
        const runtime = getFileAccessPolicyRuntime({
            isNodeEnvironment,
        });

        expect(runtime.isNodeEnvironment("test")).toBe(true);
        expect(runtime.isNodeEnvironment("production")).toBe(false);
        expect(isNodeEnvironment).toHaveBeenCalledTimes(2);
    });

    it("uses the default runtime scope", () => {
        expect.assertions(1);

        expect(getFileAccessPolicyRuntime().isNodeEnvironment("test")).toBe(
            true
        );
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(1);

        const runtime = getFileAccessPolicyRuntime(
            {} as unknown as FileAccessPolicyRuntimeScope
        );

        expect(() => runtime.isNodeEnvironment("test")).toThrow(
            "fileAccessPolicyRuntime requires nodeEnvironment provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(3);

        const isNodeEnvironment = vi.fn(() => false);
        const runtime = getFileAccessPolicyRuntime({
            isNodeEnvironment,
            process: { env: { NODE_ENV: "test" } },
        } as unknown as FileAccessPolicyRuntimeScope);

        expect(runtime.isNodeEnvironment("test")).toBe(false);
        expect(isNodeEnvironment).toHaveBeenCalledOnce();
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});
