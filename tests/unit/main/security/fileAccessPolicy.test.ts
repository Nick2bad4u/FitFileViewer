// @vitest-environment node

import path from "node:path";
import { describe, expect, it, vi } from "vitest";

type FileAccessPolicyModule = {
    __resetForTests?: () => void;
    approveFilePath: (
        filePath: unknown,
        options?: { source?: string }
    ) => string;
    isApprovedFilePath: (filePath: unknown) => boolean;
};

/**
 * Load fileAccessPolicy with a controlled realpath implementation.
 */
async function loadPolicyWithRealpath(
    realpathImpl: (filePath: string) => string
): Promise<FileAccessPolicyModule> {
    vi.resetModules();

    const realpathSync = Object.assign(
        ((filePath: string) => realpathImpl(filePath)) as (
            filePath: string
        ) => string,
        {
            native: (filePath: string) => realpathImpl(filePath),
        }
    );

    const mockedNodeModules = {
        fs: { realpathSync },
        httpRef: () => null,
        path,
    };

    vi.doMock("../../../../electron-app/main/runtime/nodeModules.js", () => ({
        ...mockedNodeModules,
        default: mockedNodeModules,
    }));

    const policy =
        await import("../../../../electron-app/main/security/fileAccessPolicy.js");
    policy.__resetForTests?.();
    return policy;
}

function getApprovalSnapshot(
    policy: FileAccessPolicyModule,
    filePaths: string[]
): Record<string, boolean> {
    return Object.fromEntries(
        filePaths.map((filePath) => [
            filePath,
            policy.isApprovedFilePath(filePath),
        ])
    );
}

describe("fileAccessPolicy", () => {
    it("rejects URI-like file paths", async () => {
        expect.assertions(2);

        const mod =
            await import("../../../../electron-app/main/security/fileAccessPolicy.js");
        mod.__resetForTests?.();

        expect(() => mod.approveFilePath("file:///tmp/a.fit")).toThrow(
            /Invalid file path/iu
        );
        expect(getApprovalSnapshot(mod, ["file:///tmp/a.fit"])).toStrictEqual({
            "file:///tmp/a.fit": false,
        });
    });

    it("rejects Windows extended-length/device path prefixes", async () => {
        expect.assertions(3);

        const mod =
            await import("../../../../electron-app/main/security/fileAccessPolicy.js");
        mod.__resetForTests?.();

        expect(() => mod.approveFilePath("\\\\?\\C:\\a.fit")).toThrow(
            /Invalid file path/iu
        );
        expect(() => mod.approveFilePath("\\\\.\\C:\\a.fit")).toThrow(
            /Invalid file path/iu
        );
        expect(
            getApprovalSnapshot(mod, ["\\\\?\\C:\\a.fit", "\\\\.\\C:\\a.fit"])
        ).toStrictEqual({
            "\\\\?\\C:\\a.fit": false,
            "\\\\.\\C:\\a.fit": false,
        });
    });

    it("keeps approvals in module state without publishing a global registry", async () => {
        expect.assertions(3);

        const mod =
            await import("../../../../electron-app/main/security/fileAccessPolicy.js");
        mod.__resetForTests?.();

        const approvedPath = mod.approveFilePath("C:/rides/activity.fit");

        expect(mod.isApprovedFilePath(approvedPath)).toBe(true);
        expect("__ffvFileAccessPolicyState" in globalThis).toBe(false);

        mod.__resetForTests?.();

        expect(mod.isApprovedFilePath(approvedPath)).toBe(false);
    });

    it("uses realpath for approvals and invalidates if the symlink retargets", async () => {
        expect.assertions(2);

        let target = "/real/a.fit";
        const mod = await loadPolicyWithRealpath(() => target);

        mod.approveFilePath("/tmp/link.fit");
        expect(getApprovalSnapshot(mod, ["/tmp/link.fit"])).toStrictEqual({
            "/tmp/link.fit": true,
        });

        // Simulate the symlink now pointing elsewhere.
        target = "/real/b.fit";
        expect(getApprovalSnapshot(mod, ["/tmp/link.fit"])).toStrictEqual({
            "/tmp/link.fit": false,
        });
    });

    it("caps the approval set to prevent unbounded growth", async () => {
        expect.assertions(1);

        const mod = await loadPolicyWithRealpath(() => {
            throw new Error("ENOENT");
        });

        const first = "/tmp/first.fit";
        mod.approveFilePath(first);

        for (let i = 0; i < 550; i += 1) {
            mod.approveFilePath(`/tmp/file-${i}.fit`);
        }

        // Oldest entries should have been evicted.
        // Newest should remain.
        expect(
            getApprovalSnapshot(mod, [first, "/tmp/file-549.fit"])
        ).toStrictEqual({
            "/tmp/file-549.fit": true,
            [first]: false,
        });
    });
});
