/**
 * Tests for recentFiles module
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type RecentFilesModule =
    typeof import("../../../../../electron-app/utils/files/recent/recentFiles.js");

describe("recentFiles utility", () => {
    const TEST_FILE_PATH = "/mock/path/recent-files-test.json";
    let cfs: any;
    let cpath: any;
    let errorSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;
    let logSpy: ReturnType<typeof vi.spyOn>;
    let writeSpyDefault: ReturnType<typeof vi.spyOn>;
    let recentFiles: RecentFilesModule;

    async function importRecentFiles(
        electronOverride: unknown = {}
    ): Promise<RecentFilesModule> {
        vi.resetModules();
        vi.doMock("node:fs", () => cfs);
        vi.doMock("node:path", () => cpath);

        const { setElectronOverride } =
            await import("../../../../../electron-app/main/runtime/electronAccess.js");
        setElectronOverride(electronOverride);

        return import("../../../../../electron-app/utils/files/recent/recentFiles.js");
    }

    beforeEach(async () => {
        // Reset all mocks
        vi.resetAllMocks();

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
        recentFiles = await importRecentFiles();
    });

    afterEach(() => {
        // Clean up
        delete process.env.RECENT_FILES_PATH;
        errorSpy?.mockRestore?.();
        warnSpy?.mockRestore?.();
        logSpy?.mockRestore?.();
        writeSpyDefault?.mockRestore?.();
    });

    function getLastWrittenRecentFiles(spy: ReturnType<typeof vi.spyOn>) {
        const calls = (spy.mock as any).calls as any[][];
        const [
            targetPath,
            payload,
            encoding,
        ] = calls.at(-1) ?? [];
        return {
            encoding,
            entries: JSON.parse(String(payload)) as string[],
            targetPath: String(targetPath),
        };
    }

    it("loadRecentFiles returns empty array when file doesn't exist", () => {
        expect.assertions(3);

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
        expect.assertions(3);

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
        expect(cfs.readFileSync).toHaveBeenCalledWith(TEST_FILE_PATH, "utf8");
    });

    it("loadRecentFiles handles file read errors", () => {
        expect.assertions(2);

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
        expect.assertions(1);

        const testData = ["file1.fit", "file2.fit"];
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        recentFiles.saveRecentFiles(testData);
        expect(getLastWrittenRecentFiles(spy)).toEqual({
            encoding: "utf8",
            entries: testData,
            targetPath: TEST_FILE_PATH,
        });
    });

    it("saveRecentFiles caps list to 10 items", () => {
        expect.assertions(1);

        // Setup: more than 10 items
        const testData = Array.from({ length: 15 }, (_, i) => `file${i}.fit`);

        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        recentFiles.saveRecentFiles(testData);

        // Verify only first 10 saved
        expect(getLastWrittenRecentFiles(spy)).toEqual({
            encoding: "utf8",
            entries: testData.slice(0, 10),
            targetPath: TEST_FILE_PATH,
        });
    });

    it("saveRecentFiles handles write errors", () => {
        expect.assertions(2);

        // Setup: write throws error
        vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {
            throw new Error("Mock write error");
        });

        // Execute
        expect(() => recentFiles.saveRecentFiles(["test.fit"])).not.toThrow();

        // Verify error handled
        expect(console.error).toHaveBeenCalledWith(
            "Failed to save recent files:",
            expect.any(Error)
        );
    });

    it("addRecentFile adds new file to beginning of list", () => {
        expect.assertions(1);

        // Setup: existing list
        const existingFiles = ["file1.fit", "file2.fit"];
        vi.spyOn(cfs, "existsSync").mockReturnValue(true as any);
        vi.spyOn(cfs, "readFileSync").mockReturnValue(
            JSON.stringify(existingFiles) as any
        );

        // Execute: add new file
        recentFiles.addRecentFile("newfile.fit");

        // Verify: new file at beginning
        expect(getLastWrittenRecentFiles(writeSpyDefault)).toEqual({
            encoding: "utf8",
            entries: [
                "newfile.fit",
                "file1.fit",
                "file2.fit",
            ],
            targetPath: TEST_FILE_PATH,
        });
    });

    it("addRecentFile moves existing file to beginning", () => {
        expect.assertions(1);

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
        expect(getLastWrittenRecentFiles(writeSpyDefault)).toEqual({
            encoding: "utf8",
            entries: [
                "file2.fit",
                "file1.fit",
                "file3.fit",
            ],
            targetPath: TEST_FILE_PATH,
        });
    });

    it("addRecentFile doesn't save if order hasn't changed", () => {
        expect.assertions(2);

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
        expect(recentFiles.loadRecentFiles()).toEqual(existingFiles);
    });

    it("addRecentFile handles non-array data", () => {
        expect.assertions(2);

        // Setup: invalid data in file
        vi.spyOn(cfs, "existsSync").mockReturnValue(true as any);
        vi.spyOn(cfs, "readFileSync").mockReturnValue('"not an array"' as any);

        // Execute: add file with invalid existing data
        recentFiles.addRecentFile("newfile.fit");

        // Verify: warning logged and new list created
        expect(console.warn).toHaveBeenCalledWith(
            "Invalid recent files list, resetting to an empty array."
        );
        expect(getLastWrittenRecentFiles(writeSpyDefault)).toEqual({
            encoding: "utf8",
            entries: ["newfile.fit"],
            targetPath: TEST_FILE_PATH,
        });
    });

    it("getShortRecentName handles empty input", () => {
        expect.assertions(2);

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
        expect.assertions(2);

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
    it("initializes RECENT_FILES_PATH from Electron userData when available", async () => {
        expect.assertions(1);

        delete process.env.RECENT_FILES_PATH;
        const rf = await importRecentFiles({
            app: { getPath: () => "/mock/userdata" },
        });
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        rf.saveRecentFiles(["a"]);
        const saved = getLastWrittenRecentFiles(spy);
        expect({
            ...saved,
            targetPath: saved.targetPath.replace(/\\/g, "/"),
        }).toEqual({
            encoding: "utf8",
            entries: ["a"],
            targetPath: "/mock/userdata/recent-files.json",
        });
    });

    it("prefers RECENT_FILES_PATH env when set", async () => {
        expect.assertions(1);

        // Ensure module re-evaluates with env path
        process.env.RECENT_FILES_PATH = TEST_FILE_PATH;
        const rf = await importRecentFiles({
            app: { getPath: () => "/should/not/use" },
        });
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        rf.saveRecentFiles(["x"]);
        expect(getLastWrittenRecentFiles(spy)).toEqual({
            encoding: "utf8",
            entries: ["x"],
            targetPath: TEST_FILE_PATH,
        });
    });

    it("invokes cleanup handler and unlinks temp file when present", async () => {
        expect.assertions(3);

        delete process.env.RECENT_FILES_PATH;
        let exitHandler: any;
        const procOn = vi
            .spyOn(process as any, "on" as any)
            .mockImplementation(((event: any, handler: any) => {
                if (event === "exit") exitHandler = handler;
            }) as any);
        const rf = await importRecentFiles();
        const writeSpy = vi
            .spyOn(cfs, "writeFileSync")
            .mockImplementation(() => {});
        const unlinkSpy = vi
            .spyOn(cfs, "unlinkSync")
            .mockImplementation(() => {});
        rf.saveRecentFiles(["z"]);
        const savedPath = String((writeSpy.mock as any).calls[0][0]);
        // Ensure cleanup sees existing file
        vi.spyOn(cfs, "existsSync").mockReturnValue(true as any);
        // Call captured handler
        expect(exitHandler).toBeTypeOf("function");
        expect(() => (exitHandler as () => void)()).not.toThrow();
        expect(unlinkSpy).toHaveBeenCalledWith(savedPath);
        procOn.mockRestore();
    });

    it("falls back when electron app.getPath throws", async () => {
        expect.assertions(2);

        delete process.env.RECENT_FILES_PATH;
        const rf = await importRecentFiles({
            app: {
                getPath: () => {
                    throw new Error("boom");
                },
            },
        });
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        rf.saveRecentFiles(["a"]);
        const saved = getLastWrittenRecentFiles(spy);
        expect(saved.entries).toEqual(["a"]);
        expect(saved.targetPath.replace(/\\/g, "/")).toMatch(
            /fit-file-viewer-tests\/recent-files-/
        );
    });

    it("falls back to TEMP when electron app.getPath unavailable and registers cleanup", async () => {
        expect.assertions(4);

        delete process.env.RECENT_FILES_PATH;
        const procOn = vi
            .spyOn(process as any, "on" as any)
            .mockImplementation(((event: any, handler: any) => {
                if (event === "exit") {
                    // invoke immediately to simulate exit later
                    (process as any).__rf_cleanup__ = handler;
                }
            }) as any);
        const rf = await importRecentFiles();
        const spy = vi.spyOn(cfs, "writeFileSync").mockImplementation(() => {});
        rf.saveRecentFiles(["a"]);
        const saved = getLastWrittenRecentFiles(spy);
        expect(saved.entries).toEqual(["a"]);
        expect(saved.targetPath.replace(/\\/g, "/")).toMatch(
            /fit-file-viewer-tests\/recent-files-/
        );
        // cleanup handler should unlink file without throwing
        expect((process as any).__rf_cleanup__).toBeTypeOf("function");
        expect(() =>
            ((process as any).__rf_cleanup__ as () => void)()
        ).not.toThrow();
        procOn.mockRestore();
    });

    it("logs error if temp dir creation fails", async () => {
        expect.assertions(4);

        delete process.env.RECENT_FILES_PATH;
        const exists = vi
            .spyOn(cfs, "existsSync")
            .mockReturnValue(false as any);
        const mkdir = vi.spyOn(cfs, "mkdirSync").mockImplementation(() => {
            throw new Error("mkdir failed");
        });
        const rf = await importRecentFiles();
        expect(rf.loadRecentFiles()).toEqual([]);
        expect(() => rf.saveRecentFiles(["a"])).not.toThrow();
        expect(writeSpyDefault).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
            "Failed to create temp directory for tests:",
            expect.any(Error)
        );
        exists.mockRestore();
        mkdir.mockRestore();
    });
});
