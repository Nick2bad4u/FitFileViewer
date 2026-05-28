// @vitest-environment node

import { createRequire } from "node:module";
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

type NodeModulesRuntime = {
    fs: {
        realpathSync: ((filePath: string) => string) & {
            native?: (filePath: string) => string;
        };
    };
    path: typeof path;
};

/**
 * Load fileAccessPolicy with a controlled realpath implementation.
 */
function loadPolicyWithRealpath(
    realpathImpl: (filePath: string) => string
): FileAccessPolicyModule {
    vi.resetModules();
    const require = createRequire(import.meta.url);

    const nodeModules =
        require("../../../../electron-app/main/runtime/nodeModules.js") as NodeModulesRuntime;

    const realpathSync = Object.assign(
        ((filePath: string) => realpathImpl(filePath)) as (
            filePath: string
        ) => string,
        {
            native: (filePath: string) => realpathImpl(filePath),
        }
    );

    // Replace fs with a minimal stub for this test.
    nodeModules.fs = { realpathSync };
    nodeModules.path = path;

    const policy =
        require("../../../../electron-app/main/security/fileAccessPolicy.js") as FileAccessPolicyModule;
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
        expect.hasAssertions();

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
        expect.hasAssertions();

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

    it("uses realpath for approvals and invalidates if the symlink retargets", async () => {
        expect.hasAssertions();

        let target = "/real/a.fit";
        const mod = loadPolicyWithRealpath(() => target);

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
        expect.hasAssertions();

        const mod = loadPolicyWithRealpath(() => {
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
