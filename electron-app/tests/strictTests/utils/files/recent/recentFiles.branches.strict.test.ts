import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("recentFiles.js branch coverage (strict)", () => {
    const MODULE_PATH = "../../../../../utils/files/recent/recentFiles.js";
    let cfs: any;

    function requireFresh() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const modPath = require.resolve(MODULE_PATH);
        // @ts-ignore
        delete require.cache[modPath];
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require(MODULE_PATH);
    }

    beforeEach(() => {
        vi.resetModules();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        cfs = require("fs");
    });

    afterEach(() => {
        delete process.env.RECENT_FILES_PATH;
    });

    it("cleanup handler swallows unlink errors (catch branch)", () => {
        // Force fallback path (no explicit RECENT_FILES_PATH, no usable electron path)
        delete process.env.RECENT_FILES_PATH;
        try {
            const eid = require.resolve("electron");
            delete require.cache[eid];
            require.cache[eid] = {
                id: eid,
                filename: eid,
                loaded: true,
                exports: {},
            } as any;
        } catch {}

        let exitHandler: any;
        const procOn = vi
            .spyOn(process as any, "on" as any)
            .mockImplementation(((event: any, handler: any) => {
                if (event === "exit") exitHandler = handler;
                // @ts-ignore
                return process;
            }) as any);

        const rf = requireFresh();
        const writeSpy = vi
            .spyOn(cfs, "writeFileSync")
            .mockImplementation(() => {});
        rf.saveRecentFiles(["a"]);
        const savedPath = String((writeSpy as any).mock.calls[0][0]);

        const existsSpy = vi
            .spyOn(cfs, "existsSync")
            // Only claim the saved path exists
            .mockImplementation((p: any) => String(p) === savedPath);
        const unlinkSpy = vi.spyOn(cfs, "unlinkSync").mockImplementation(() => {
            throw new Error("unlink boom");
        });

        // Should not throw due to internal try/catch in exit handler
        expect(() => exitHandler?.()).not.toThrow();
        expect(existsSpy).toHaveBeenCalled();
        expect(unlinkSpy).toHaveBeenCalled();

        procOn.mockRestore();
        existsSpy.mockRestore();
        unlinkSpy.mockRestore();
    });
});
