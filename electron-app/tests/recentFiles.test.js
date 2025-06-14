import { describe, it, expect, beforeEach, afterEach } from "vitest";

const fs = require("fs");
const path = require("path");
const recentFiles = require("../utils/recentFiles");

describe("recentFiles", () => {
    const testPath = path.join(process.cwd(), "recent-files-test.json");
    beforeEach(() => {
        process.env.RECENT_FILES_PATH = testPath;
        if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
    });
    afterEach(() => {
        if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
        delete process.env.RECENT_FILES_PATH;
    });
    it("should save and load recent files", () => {
        recentFiles.saveRecentFiles(["a", "b", "c"]);
        const loaded = recentFiles.loadRecentFiles();
        expect(loaded).toEqual(["a", "b", "c"]);
    });
    it("should add a recent file and move it to the top", () => {
        recentFiles.saveRecentFiles(["a", "b", "c"]);
        recentFiles.addRecentFile("b");
        const loaded = recentFiles.loadRecentFiles();
        expect(loaded[0]).toBe("b");
        expect(loaded).toContain("a");
        expect(loaded).toContain("c");
    });
    it("should not exceed max recent files", () => {
        const files = Array.from({ length: 15 }, (_, i) => `file${i}`);
        recentFiles.saveRecentFiles(files);
        const loaded = recentFiles.loadRecentFiles();
        expect(loaded.length).toBeLessThanOrEqual(10);
    });
    it("should get short recent name", () => {
        expect(recentFiles.getShortRecentName("C:/foo/bar.txt")).toBe("bar.txt");
    });
    it("should return empty array if file does not exist", () => {
        if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
        expect(recentFiles.loadRecentFiles()).toEqual([]);
    });
});
