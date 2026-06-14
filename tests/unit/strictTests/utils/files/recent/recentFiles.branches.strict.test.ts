import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type RecentFilesModule = {
    saveRecentFiles: (list: string[]) => void;
};

describe("recentFiles.js branch coverage (strict)", () => {
    let cfs: typeof import("node:fs");

    async function importFresh(): Promise<RecentFilesModule> {
        vi.resetModules();
        vi.doMock("node:fs", () => cfs);

        const { setElectronOverride } =
            await import("../../../../../../electron-app/main/runtime/electronAccess.js");
        setElectronOverride({});

        return import("../../../../../../electron-app/utils/files/recent/recentFiles.js");
    }

    beforeEach(() => {
        vi.resetModules();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        cfs = require("fs");
    });

    afterEach(() => {
        delete process.env.RECENT_FILES_PATH;
    });

    it("cleanup handler swallows unlink errors (catch branch)", async () => {
        expect.hasAssertions();

        // Force fallback path (no explicit RECENT_FILES_PATH, no usable electron path)
        delete process.env.RECENT_FILES_PATH;

        let exitHandler: (() => void) | undefined;
        const procOn = vi
            .spyOn(process, "on")
            .mockImplementation((event, handler) => {
                if (event === "exit") {
                    exitHandler = () => {
                        handler(0);
                    };
                }
                return process;
            });

        const rf = await importFresh();
        const writeSpy = vi
            .spyOn(cfs, "writeFileSync")
            .mockImplementation(() => {});
        rf.saveRecentFiles(["a"]);
        const savedPath = String(writeSpy.mock.calls[0][0]);

        const existsSpy = vi
            .spyOn(cfs, "existsSync")
            // Only claim the saved path exists
            .mockImplementation((p) => String(p) === savedPath);
        const unlinkSpy = vi
            .spyOn(cfs, "unlinkSync")
            .mockImplementation((): void => {
                throw new Error("unlink boom");
            });

        // Should not throw due to internal try/catch in exit handler
        expect(() => exitHandler?.()).not.toThrow();
        expect(existsSpy).toHaveBeenCalledWith(savedPath);
        expect(unlinkSpy).toHaveBeenCalledWith(savedPath);

        procOn.mockRestore();
        existsSpy.mockRestore();
        unlinkSpy.mockRestore();
    });
});
