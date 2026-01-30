/**
 * Tests for recentFiles module
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("recentFiles utility", () => {
    const TEST_FILE_PATH = "/mock/path/recent-files-test.json";
    let cfs: any;
    let cpath: any;
    let errorSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;
    let logSpy: ReturnType<typeof vi.spyOn>;
    let writeSpyDefault: ReturnType<typeof vi.spyOn>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recentFiles: any;

    beforeEach(() => {
        // Reset all mocks
        vi.resetAllMocks();
        vi.resetModules();

        // Clear the cache to ensure fresh module load
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        delete require.cache[
            require.resolve("../../../../../utils/files/recent/recentFiles.js")
        ];

        // Setup environment variable for test file path
        process.env.RECENT_FILES_PATH = TEST_FILE_PATH;

        // Recreate console spies after reset
        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        // Grab CJS references for Node core modules to spy on the same instances used by the implementation
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        cfs = require("fs");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        cpath = require("path");

        // Default: neutralize writes to real filesystem and allow call assertions
        writeSpyDefault = vi
            .spyOn(cfs, "writeFileSync")
            .mockImplementation(() => {});

        // Import the module after mocks and spies are setup
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        recentFiles = require("../../../../../utils/files/recent/recentFiles.js");
    });

    afterEach(() => {
        // Clean up
        delete process.env.RECENT_FILES_PATH;
        errorSpy.mockRestore();
        warnSpy.mockRestore();
        logSpy.mockRestore();
        writeSpyDefault?.mockRestore?.();
    });

    it("loadRecentFiles returns empty array when file doesn't exist", () => {
        // Setup
        vi.spyOn(cfs, "existsSync").mockReturnValue(false as any);
        const readSpy = vi.spyOn(cfs, "readFileSync");

        // Execute
        const result = recentFiles.loadRecentFiles();

        // Verify
        expect(result).toEqual([]);
        expect(cfs.existsSync).toHaveBeenCalledWith(TEST_FILE_PATH);
        expect(readSpy).not.toHaveBeenCalled();
    });

    it("loadRecentFiles returns parsed JSON when file exists", () => {
        // Setup
        const testData = ["file1.fit", "file2.fit"];
        vi.spyOn(cfs, "existsSync").mockReturnValue(true as any);
        vi.spyOn(cfs, "readFileSync").mockReturnValue(
            JSON.stringify(testData) as any
        );

        // Execute
        const result = recentFiles.loadRecentFiles();

        // Verify
        expect(result).toEqual(testData);
        expect(cfs.existsSync).toHaveBeenCalledWith(TEST_FILE_PATH);
        expect(cfs.readFileSync).toHaveBeenCalledWith(TEST_FILE_PATH);
    });

    it("loadRecentFiles handles file read errors", () => {
        // Setup
        vi.spyOn(cfs, "existsSync").mockReturnValue(true as any);
        vi.spyOn(cfs, "readFileSync").mockImplementation(() => {
            throw new Error("Mock read error");
        });

        // Execute
        const result = recentFiles.loadRecentFiles();

        // Verify
        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(
            "Failed to load recent files:",
            expect.any(Error)
        );
    });
    it("saveRecentFiles writes data to file", () => {
        const testData = ["file1.fit", "file2.fit"];
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        recentFiles.saveRecentFiles(testData);
        expect(spy).toHaveBeenCalledWith(
            TEST_FILE_PATH,
            JSON.stringify(testData),
            "utf8"
        );
    });

    it("saveRecentFiles caps list to 10 items", () => {
        // Setup: more than 10 items
        const testData = Array.from({ length: 15 }, (_, i) => `file${i}.fit`);

        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        recentFiles.saveRecentFiles(testData);

        // Verify only first 10 saved
        expect(spy).toHaveBeenCalledWith(
            TEST_FILE_PATH,
            JSON.stringify(testData.slice(0, 10)),
            "utf8"
        );
    });

    it("saveRecentFiles handles write errors", () => {
        // Setup: write throws error
        vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {
            throw new Error("Mock write error");
        });

        // Execute
        recentFiles.saveRecentFiles(["test.fit"]);

        // Verify error handled
        expect(console.error).toHaveBeenCalledWith(
            "Failed to save recent files:",
            expect.any(Error)
        );
    });

    it("addRecentFile adds new file to beginning of list", () => {
        // Setup: existing list
        const existingFiles = ["file1.fit", "file2.fit"];
        vi.spyOn(cfs, "existsSync").mockReturnValue(true as any);
        vi.spyOn(cfs, "readFileSync").mockReturnValue(
            JSON.stringify(existingFiles) as any
        );

        // Execute: add new file
        recentFiles.addRecentFile("newfile.fit");

        // Verify: new file at beginning
        expect(cfs.writeFileSync).toHaveBeenCalledWith(
            TEST_FILE_PATH,
            JSON.stringify([
                "newfile.fit",
                "file1.fit",
                "file2.fit",
            ]),
            "utf8"
        );
    });

    it("addRecentFile moves existing file to beginning", () => {
        // Setup: existing list with file to be moved
        const existingFiles = [
            "file1.fit",
            "file2.fit",
            "file3.fit",
        ];
        vi.spyOn(cfs, "existsSync").mockReturnValue(true as any);
        vi.spyOn(cfs, "readFileSync").mockReturnValue(
            JSON.stringify(existingFiles) as any
        );

        // Execute: move existing file to top
        recentFiles.addRecentFile("file2.fit");

        // Verify: file moved to beginning
        expect(cfs.writeFileSync).toHaveBeenCalledWith(
            TEST_FILE_PATH,
            JSON.stringify([
                "file2.fit",
                "file1.fit",
                "file3.fit",
            ]),
            "utf8"
        );
    });

    it("addRecentFile doesn't save if order hasn't changed", () => {
        // Setup: file already at top
        const existingFiles = ["file1.fit", "file2.fit"];
        vi.spyOn(cfs, "existsSync").mockReturnValue(true as any);
        vi.spyOn(cfs, "readFileSync").mockReturnValue(
            JSON.stringify(existingFiles) as any
        );

        // Execute: add file already at top
        recentFiles.addRecentFile("file1.fit");

        // Verify: no write occurred
        expect(cfs.writeFileSync).not.toHaveBeenCalled();
    });

    it("addRecentFile handles non-array data", () => {
        // Setup: invalid data in file
        vi.spyOn(cfs, "existsSync").mockReturnValue(true as any);
        vi.spyOn(cfs, "readFileSync").mockReturnValue('"not an array"' as any);

        // Execute: add file with invalid existing data
        recentFiles.addRecentFile("newfile.fit");

        // Verify: warning logged and new list created
        expect(console.warn).toHaveBeenCalledWith(
            "Invalid recent files list, resetting to an empty array."
        );
        expect(cfs.writeFileSync).toHaveBeenCalledWith(
            TEST_FILE_PATH,
            JSON.stringify(["newfile.fit"]),
            "utf8"
        );
    });

    it("getShortRecentName handles empty input", () => {
        // Setup - ensure console.warn is clear
        vi.spyOn(console, "warn").mockClear();

        // Execute
        const result = recentFiles.getShortRecentName("");

        // Verify
        expect(result).toBe("");
        expect(console.warn).toHaveBeenCalledWith(
            "Invalid file path provided to getShortRecentName."
        );
    });

    it("getShortRecentName returns basename of file path", () => {
        // Setup
        const filePath = "C:/path/to/file.fit";
        vi.spyOn(cpath, "basename").mockReturnValue("file.fit" as any);

        // Execute
        const result = recentFiles.getShortRecentName(filePath);

        // Verify
        expect(result).toBe("file.fit");
        expect(cpath.basename).toHaveBeenCalledWith(filePath);
    });

    // Initialization branch coverage
    function requireFresh() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const modPath =
            require.resolve("../../../../../utils/files/recent/recentFiles.js");
        // @ts-ignore
        delete require.cache[modPath];
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require("../../../../../utils/files/recent/recentFiles.js");
    }

    it("initializes RECENT_FILES_PATH from Electron userData when available", async () => {
        delete process.env.RECENT_FILES_PATH;
        // Force-inject a CommonJS cache entry for 'electron' so CJS require in implementation sees it
        const eid = require.resolve("electron");
        require.cache[eid] = {
            id: eid,
            filename: eid,
            loaded: true,
            exports: { app: { getPath: () => "/mock/userdata" } },
        } as any;
        const rf = requireFresh();
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        rf.saveRecentFiles(["a"]);
        const calledPath = String((spy.mock as any).calls[0][0]).replace(
            /\\/g,
            "/"
        );
        expect(calledPath).toBe("/mock/userdata/recent-files.json");
    });

    it("prefers RECENT_FILES_PATH env when set", () => {
        // Ensure module re-evaluates with env path
        process.env.RECENT_FILES_PATH = TEST_FILE_PATH;
        const eid = require.resolve("electron");
        // Provide an electron app too; env should still take precedence
        require.cache[eid] = {
            id: eid,
            filename: eid,
            loaded: true,
            exports: { app: { getPath: () => "/should/not/use" } },
        } as any;
        const rf = requireFresh();
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        rf.saveRecentFiles(["x"]);
        expect(String((spy.mock as any).calls[0][0])).toBe(TEST_FILE_PATH);
    });

    it("invokes cleanup handler and unlinks temp file when present", () => {
        delete process.env.RECENT_FILES_PATH;
        // Ensure electron missing
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
        const unlinkSpy = vi
            .spyOn(cfs, "unlinkSync")
            .mockImplementation(() => {});
        rf.saveRecentFiles(["z"]);
        const savedPath = String((writeSpy.mock as any).calls[0][0]);
        // Ensure cleanup sees existing file
        vi.spyOn(cfs, "existsSync").mockImplementation(
            (p: any) => String(p) === savedPath
        );
        // Call captured handler
        exitHandler?.();
        expect(unlinkSpy).toHaveBeenCalledWith(savedPath);
        procOn.mockRestore();
    });

    it("falls back when electron app.getPath throws", () => {
        delete process.env.RECENT_FILES_PATH;
        // Provide electron with throwing getPath
        const eid = require.resolve("electron");
        require.cache[eid] = {
            id: eid,
            filename: eid,
            loaded: true,
            exports: {
                app: {
                    getPath: () => {
                        throw new Error("boom");
                    },
                },
            },
        } as any;
        const rf = requireFresh();
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        rf.saveRecentFiles(["a"]);
        const p = String((spy.mock as any).calls[0][0]).replace(/\\/g, "/");
        expect(p).toMatch(/fit-file-viewer-tests\/recent-files-/);
    });

    it("falls back to TEMP when electron app.getPath unavailable and registers cleanup", () => {
        delete process.env.RECENT_FILES_PATH;
        // Ensure electron CJS cache does not provide app.getPath
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
        const procOn = vi
            .spyOn(process as any, "on" as any)
            .mockImplementation(((event: any, handler: any) => {
                if (event === "exit") {
                    // invoke immediately to simulate exit later
                    (process as any).__rf_cleanup__ = handler;
                }
                // @ts-ignore
                return process;
            }) as any);
        const rf = requireFresh();
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        rf.saveRecentFiles(["a"]);
        expect(spy).toHaveBeenCalled();
        // cleanup handler should unlink file without throwing
        (process as any).__rf_cleanup__?.();
        procOn.mockRestore();
    });

    it("logs error if temp dir creation fails", () => {
        delete process.env.RECENT_FILES_PATH;
        // Force fallback by clearing electron CJS cache
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
        const exists = vi
            .spyOn(cfs, "existsSync")
            .mockReturnValue(false as any);
        const mkdir = vi.spyOn(cfs, "mkdirSync").mockImplementation(() => {
            throw new Error("mkdir failed");
        });
        requireFresh();
        expect(console.error).toHaveBeenCalled();
        exists.mockRestore();
        mkdir.mockRestore();
    });
});
