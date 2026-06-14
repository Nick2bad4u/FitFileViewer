import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type RecentFilesModule =
    typeof import("../../../../../electron-app/utils/files/recent/recentFiles.js");

describe("recentFiles integration coverage", () => {
    const createdFiles = new Set<string>();
    const createdDirs = new Set<string>();

    function registerFile(target: string) {
        createdFiles.add(path.normalize(target));
    }

    function registerDir(target: string) {
        createdDirs.add(path.normalize(target));
    }

    function createTempFitFile(directory: string, fileName: string): string {
        const filePath = path.join(directory, fileName);
        fs.writeFileSync(filePath, Buffer.alloc(0));
        registerFile(filePath);
        return filePath;
    }

    beforeEach(() => {
        vi.resetModules();
        delete process.env.RECENT_FILES_PATH;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        createdFiles.forEach((filePath) => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch {
                // ignore unlink issues in cleanup
            }
        });
        createdDirs.forEach((dirPath) => {
            try {
                if (fs.existsSync(dirPath)) {
                    fs.rmSync(dirPath, { recursive: true, force: true });
                }
            } catch {
                // ignore remove issues in cleanup
            }
        });
        createdFiles.clear();
        createdDirs.clear();
    });

    async function importRecentFiles(
        electronOverride: unknown = {}
    ): Promise<RecentFilesModule> {
        vi.resetModules();
        vi.doMock("node:fs", () => fs);
        vi.doMock("node:path", () => path);

        const { setElectronOverride } =
            await import("../../../../../electron-app/main/runtime/electronAccess.js");
        setElectronOverride(electronOverride);

        return import("../../../../../electron-app/utils/files/recent/recentFiles.js");
    }

    it("derives the storage path from electron userData", async () => {
        expect.assertions(2);

        const userDataPath = fs.mkdtempSync(
            path.join(os.tmpdir(), "ffv-user-")
        );
        registerDir(userDataPath);
        const recent = await importRecentFiles({
            app: {
                getPath: vi.fn<(name: string) => string>(() => userDataPath),
            },
        });
        const expectedPath = path.join(userDataPath, "recent-files.json");
        registerFile(expectedPath);
        const fitFilePath = createTempFitFile(userDataPath, "a.fit");
        recent.saveRecentFiles([fitFilePath]);
        expect(JSON.parse(fs.readFileSync(expectedPath, "utf8"))).toEqual([
            fitFilePath,
        ]);
        expect(recent.loadRecentFiles()).toEqual([fitFilePath]);
    });

    it("creates a temp-backed recent file when electron app is unavailable", async () => {
        expect.assertions(6);

        const exitHandlers: Array<() => void> = [];
        const processOn = vi
            .spyOn(process, "on")
            .mockImplementation(
                (
                    event: string | symbol,
                    handler: (...args: unknown[]) => unknown
                ) => {
                    if (event === "exit") {
                        exitHandlers.push(handler as () => void);
                    }
                    return process;
                }
            );
        const recent = await importRecentFiles();
        const fitFileDir = fs.mkdtempSync(path.join(os.tmpdir(), "ffv-fit-"));
        registerDir(fitFileDir);
        const fitFilePath = createTempFitFile(fitFileDir, "temp.fit");
        const originalWrite = fs.writeFileSync;
        const writeSpy = vi
            .spyOn(fs, "writeFileSync")
            .mockImplementation((target, data, encoding) => {
                const normalized = path.normalize(String(target));
                registerFile(normalized);
                originalWrite(
                    normalized,
                    data as string | NodeJS.ArrayBufferView,
                    encoding as BufferEncoding
                );
            });
        recent.saveRecentFiles([fitFilePath]);
        expect(writeSpy).toHaveBeenCalledWith(
            expect.stringMatching(/fit-file-viewer-tests[\\/]+recent-files-/u),
            JSON.stringify([fitFilePath]),
            "utf8"
        );
        const targetPath = path.normalize(String(writeSpy.mock.calls[0][0]));
        expect(targetPath).toMatch(/fit-file-viewer-tests[\\/]+recent-files-/);
        expect(JSON.parse(fs.readFileSync(targetPath, "utf8"))).toEqual([
            fitFilePath,
        ]);
        expect(recent.loadRecentFiles()).toEqual([fitFilePath]);
        expect(exitHandlers).toHaveLength(1);
        exitHandlers[0]!();
        expect(() => fs.statSync(targetPath)).toThrow(/ENOENT|no such file/u);
        processOn.mockRestore();
        writeSpy.mockRestore();
    });

    it("saves and reloads recent files using the configured path", async () => {
        expect.assertions(1);

        const tempDir = path.join(os.tmpdir(), "ffv-recent-integration");
        fs.mkdirSync(tempDir, { recursive: true });
        registerDir(tempDir);
        const filePath = path.join(tempDir, `recent-${Date.now()}.json`);
        registerFile(filePath);
        process.env.RECENT_FILES_PATH = filePath;
        const recent = await importRecentFiles();
        const fitFileDir = path.join(tempDir, "activities");
        fs.mkdirSync(fitFileDir, { recursive: true });
        const entries = [
            createTempFitFile(fitFileDir, "alpha.fit"),
            createTempFitFile(fitFileDir, "beta.fit"),
            createTempFitFile(fitFileDir, "gamma.fit"),
        ];
        recent.saveRecentFiles(entries);
        const loaded = recent.loadRecentFiles();
        expect(loaded).toEqual(entries);
    });

    it("logs and continues when temp directory creation fails", async () => {
        expect.assertions(3);

        const originalExists = fs.existsSync;
        const existsSpy = vi
            .spyOn(fs, "existsSync")
            .mockImplementation((candidate: fs.PathLike) => {
                if (
                    typeof candidate === "string" &&
                    candidate.includes("fit-file-viewer-tests")
                ) {
                    return false;
                }
                return originalExists(candidate);
            });
        const mkdirSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => {
            throw new Error("mkdir failure");
        });
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const recent = await importRecentFiles();
        expect(errorSpy).toHaveBeenCalledWith(
            "Failed to create temp directory for tests:",
            expect.any(Error)
        );
        expect(recent.loadRecentFiles()).toEqual([]);
        expect(() => recent.saveRecentFiles(["unwritten.fit"])).not.toThrow();
        mkdirSpy.mockRestore();
        errorSpy.mockRestore();
        existsSpy.mockRestore();
    });
});
