import os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";

import { appRef } from "../../../main/runtime/electronAccess.js";

const recentFilesAppRef = appRef as () =>
    | { getPath(name: "userData"): string }
    | undefined;

let RECENT_FILES_PATH: string | undefined;

function getRecentProcessEnvironmentValue(name: string): string | undefined {
    try {
        const processValue = Reflect.get(globalThis, "process") as
            | { env?: Record<string, unknown> }
            | undefined;
        const value = processValue?.env?.[name];
        return typeof value === "string" ? value : undefined;
    } catch {
        return undefined;
    }
}

const RECENT_ENV = getRecentProcessEnvironmentValue("RECENT_FILES_PATH");
if (RECENT_ENV) {
    RECENT_FILES_PATH = RECENT_ENV;
} else {
    let userDataPath: string | null = null;
    try {
        const app = recentFilesAppRef();
        userDataPath =
            app && typeof app.getPath === "function"
                ? app.getPath("userData")
                : null;
    } catch {
        userDataPath = null;
    }

    if (userDataPath) {
        RECENT_FILES_PATH = path.join(userDataPath, "recent-files.json");
    } else {
        const TEMP = getRecentProcessEnvironmentValue("TEMP");
        const TMP = getRecentProcessEnvironmentValue("TMP");
        const VITEST_WORKER_ID =
            getRecentProcessEnvironmentValue("VITEST_WORKER_ID");
        const tempDir = TEMP || TMP || os.tmpdir();
        const fitTempDir = path.join(tempDir, "fit-file-viewer-tests");

        try {
            if (!fs.existsSync(fitTempDir)) {
                fs.mkdirSync(fitTempDir, { recursive: true });
            }

            const testId = VITEST_WORKER_ID || String(process.pid);
            RECENT_FILES_PATH = path.join(
                fitTempDir,
                `recent-files-${testId}.json`
            );

            process.on("exit", () => {
                try {
                    if (RECENT_FILES_PATH && fs.existsSync(RECENT_FILES_PATH)) {
                        fs.unlinkSync(RECENT_FILES_PATH);
                    }
                } catch {
                    // Ignore best-effort temp-file cleanup errors.
                }
            });
        } catch (error) {
            console.error("Failed to create temp directory for tests:", error);
        }
    }
}

const MAX_RECENT_FILES = 10;

export function addRecentFile(filePath: string): void {
    let list = loadRecentFiles();
    if (!Array.isArray(list)) {
        console.warn("Invalid recent files list, resetting to an empty array.");
        list = [];
    }

    const originalList = [...list];
    if (list.includes(filePath)) {
        list = list.filter((entry) => entry !== filePath);
    }

    list.unshift(filePath);
    if (JSON.stringify(originalList) !== JSON.stringify(list)) {
        saveRecentFiles(list);
    }
}

export function getShortRecentName(file: string): string {
    if (!file) {
        console.warn("Invalid file path provided to getShortRecentName.");
        return "";
    }
    return path.basename(file);
}

export function loadRecentFiles(): string[] {
    try {
        if (!RECENT_FILES_PATH || !fs.existsSync(RECENT_FILES_PATH)) {
            return [];
        }

        const data = fs.readFileSync(RECENT_FILES_PATH, "utf8");
        const parsed: unknown = JSON.parse(data);
        if (!Array.isArray(parsed)) {
            console.warn(
                "Invalid recent files list, resetting to an empty array."
            );
            return [];
        }
        const validEntries = parsed.filter(
            (entry): entry is string =>
                typeof entry === "string" && fs.existsSync(entry)
        );

        if (validEntries.length !== parsed.length) {
            saveRecentFiles(validEntries);
        }

        return validEntries;
    } catch (error) {
        console.error("Failed to load recent files:", error);
    }
    return [];
}

export function saveRecentFiles(list: string[]): void {
    try {
        if (!RECENT_FILES_PATH) {
            return;
        }

        fs.writeFileSync(
            RECENT_FILES_PATH,
            JSON.stringify(list.slice(0, MAX_RECENT_FILES)),
            "utf8"
        );
    } catch (error) {
        console.error("Failed to save recent files:", error);
    }
}

export default {
    addRecentFile,
    getShortRecentName,
    loadRecentFiles,
    saveRecentFiles,
};
