import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("recentFiles integration coverage", () => {
    const createdFiles = new Set<string>();
    const createdDirs = new Set<string>();

    function registerFile(target: string) {
        createdFiles.add(path.normalize(target));
    }

    function registerDir(target: string) {
        createdDirs.add(path.normalize(target));
    }

    function setElectronMock(exports: unknown) {
        try {
            const electronId = require.resolve("electron");
            require.cache[electronId] = {
                id: electronId,
                filename: electronId,
                loaded: true,
                exports,
            } as NodeModule;
        } catch {
            // If resolution fails, fall back to vitest mocking as a safeguard
            vi.doMock("electron", () => exports as never);
        }
    }

    beforeEach(() => {
        vi.resetModules();
        delete process.env.RECENT_FILES_PATH;
        try {
            const electronId = require.resolve("electron");
            delete require.cache[electronId];
        } catch {
            // ignore when module isn't cached
        }
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

    function importRecentFiles() {
        try {
            const modPath = require.resolve("../../../../../utils/files/recent/recentFiles.js");
            delete require.cache[modPath];
        } catch {
            // ignore cache miss
        }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require("../../../../../utils/files/recent/recentFiles.js");
    }

    it("derives the storage path from electron userData", () => {
        const userDataPath = path.join(os.tmpdir(), `ffv-user-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        fs.mkdirSync(userDataPath, { recursive: true });
        registerDir(userDataPath);
        setElectronMock({
            app: {
                getPath: vi.fn(() => userDataPath),
            },
        });
        const recent = importRecentFiles();
        const writeSpy = vi.spyOn(fs, "writeFileSync");
        recent.saveRecentFiles(["a.fit"]);
        expect(writeSpy).toHaveBeenCalledWith(
            path.join(userDataPath, "recent-files.json"),
            JSON.stringify(["a.fit"]),
            "utf8"
        );
    });

    it("creates a temp-backed recent file when electron app is unavailable", () => {
        setElectronMock({});
        const exitHandlers: Array<() => void> = [];
        const processOn = vi.spyOn(process, "on").mockImplementation((event: string | symbol, handler: (...args: unknown[]) => unknown) => {
            if (event === "exit") {
                exitHandlers.push(handler as () => void);
            }
            return process;
        });
        const recent = importRecentFiles();
        const originalWrite = fs.writeFileSync;
        const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation((target, data, encoding) => {
            const normalized = path.normalize(String(target));
            registerFile(normalized);
            originalWrite(normalized, data as string | NodeJS.ArrayBufferView, encoding as BufferEncoding);
        });
        recent.saveRecentFiles(["temp.fit"]);
        expect(writeSpy).toHaveBeenCalled();
        const targetPath = path.normalize(String(writeSpy.mock.calls[0][0]));
        expect(targetPath).toMatch(/fit-file-viewer-tests[\\/]+recent-files-/);
        expect(exitHandlers).toHaveLength(1);
        const originalExists = fs.existsSync;
        const existsSpy = vi.spyOn(fs, "existsSync").mockImplementation((candidate: fs.PathLike) => {
            if (path.normalize(String(candidate)) === targetPath) {
                return true;
            }
            return originalExists(candidate);
        });
        const unlinkSpy = vi.spyOn(fs, "unlinkSync");
        exitHandlers[0]!();
        expect(unlinkSpy).toHaveBeenCalledWith(targetPath);
        processOn.mockRestore();
        existsSpy.mockRestore();
        writeSpy.mockRestore();
    });

    it("saves and reloads recent files using the configured path", () => {
        const tempDir = path.join(os.tmpdir(), "ffv-recent-integration");
        fs.mkdirSync(tempDir, { recursive: true });
        registerDir(tempDir);
        const filePath = path.join(tempDir, `recent-${Date.now()}.json`);
        registerFile(filePath);
        process.env.RECENT_FILES_PATH = filePath;
        setElectronMock({});
        const recent = importRecentFiles();
        const entries = ["alpha.fit", "beta.fit", "gamma.fit"];
        recent.saveRecentFiles(entries);
        const loaded = recent.loadRecentFiles();
        expect(loaded).toEqual(entries);
    });

    it("logs and continues when temp directory creation fails", () => {
        setElectronMock({});
        const originalExists = fs.existsSync;
        const existsSpy = vi.spyOn(fs, "existsSync").mockImplementation((candidate: fs.PathLike) => {
            if (typeof candidate === "string" && candidate.includes("fit-file-viewer-tests")) {
                return false;
            }
            return originalExists(candidate);
        });
        const mkdirSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => {
            throw new Error("mkdir failure");
        });
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        importRecentFiles();
        expect(errorSpy).toHaveBeenCalledWith(
            "Failed to create temp directory for tests:",
            expect.any(Error)
        );
        mkdirSpy.mockRestore();
        errorSpy.mockRestore();
        existsSpy.mockRestore();
    });
});
