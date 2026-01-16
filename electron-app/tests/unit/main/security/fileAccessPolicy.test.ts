/**
 * @vitest-environment node
 */

import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

/**
 * Load fileAccessPolicy with a controlled realpath implementation.
 *
 * @param {(p: string) => string} realpathImpl
 */
function loadPolicyWithRealpath(realpathImpl: (p: string) => string) {
    vi.resetModules();
    const require = createRequire(import.meta.url);

    /** @type {{ fs: any; path: typeof import('node:path') }} */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nodeModules = require("../../../../main/runtime/nodeModules.js");

    const realpathSync = Object.assign(((p: string) => realpathImpl(p)) as (p: string) => string, {
        native: (p: string) => realpathImpl(p),
    });

    // Replace fs with a minimal stub for this test.
    nodeModules.fs = { realpathSync };
    nodeModules.path = path;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const policy = require("../../../../main/security/fileAccessPolicy.js");
    policy.__resetForTests?.();
    return policy;
}

describe("fileAccessPolicy", () => {
    it("rejects URI-like file paths", async () => {
        const mod = await import("../../../../main/security/fileAccessPolicy.js");
        mod.__resetForTests?.();

        expect(() => mod.approveFilePath("file:///tmp/a.fit")).toThrow(/Invalid file path/iu);
        expect(mod.isApprovedFilePath("file:///tmp/a.fit")).toBe(false);
    });

    it("rejects Windows extended-length/device path prefixes", async () => {
        const mod = await import("../../../../main/security/fileAccessPolicy.js");
        mod.__resetForTests?.();

        expect(() => mod.approveFilePath("\\\\?\\C:\\a.fit")).toThrow(/Invalid file path/iu);
        expect(mod.isApprovedFilePath("\\\\.\\C:\\a.fit")).toBe(false);
    });

    it("uses realpath for approvals and invalidates if the symlink retargets", async () => {
        let target = "/real/a.fit";
        const mod = loadPolicyWithRealpath(() => target);

        mod.approveFilePath("/tmp/link.fit", { source: "test" });
        expect(mod.isApprovedFilePath("/tmp/link.fit")).toBe(true);

        // Simulate the symlink now pointing elsewhere.
        target = "/real/b.fit";
        expect(mod.isApprovedFilePath("/tmp/link.fit")).toBe(false);
    });

    it("caps the approval set to prevent unbounded growth", async () => {
        const mod = loadPolicyWithRealpath(() => {
            throw new Error("ENOENT");
        });

        const first = "/tmp/first.fit";
        mod.approveFilePath(first, { source: "test" });

        for (let i = 0; i < 550; i += 1) {
            mod.approveFilePath(`/tmp/file-${i}.fit`, { source: "test" });
        }

        // Oldest entries should have been evicted.
        expect(mod.isApprovedFilePath(first)).toBe(false);
        // Newest should remain.
        expect(mod.isApprovedFilePath("/tmp/file-549.fit")).toBe(true);
    });
});
