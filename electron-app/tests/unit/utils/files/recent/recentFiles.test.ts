import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from 'fs';
import path from 'path';

// From tests/unit/utils/files/recent -> utils/files/recent requires going up 5 levels
const SUT = "../../../../../utils/files/recent/recentFiles.js";

describe("recentFiles utility", () => {
  // Store the generated file paths to clean them up later
  const tempFilePaths: string[] = [];
  const testTempDir = path.join(process.cwd(), 'temp-test-files');

  beforeEach(() => {
    vi.resetModules();
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(testTempDir)) {
      fs.mkdirSync(testTempDir, { recursive: true });
    }

    // Ensure each test uses a unique file path to avoid cross-test contamination
    const filename = `recent-files-${Math.random().toString(36).slice(2)}.json`;
    const fullPath = path.join(testTempDir, filename);
    process.env.RECENT_FILES_PATH = fullPath;
    tempFilePaths.push(fullPath);
  });

  afterEach(() => {
    // Clean up any generated files
    tempFilePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Failed to delete temporary file ${filePath}:`, err);
        }
      }
    });

    delete process.env.RECENT_FILES_PATH;
    vi.restoreAllMocks();
  });

  function mockFsLayer(initial: any = undefined) {
    const mem: Record<string, string> = {};
    const exists = initial !== undefined;
    if (exists) mem["recent-files-test.json"] = JSON.stringify(initial);
    vi.doMock("fs", () => ({
      existsSync: vi.fn((p: string) => Boolean(mem[p.split(/[/\\]/).pop() as string])),
      readFileSync: vi.fn((p: string) => mem[p.split(/[/\\]/).pop() as string] || ""),
      writeFileSync: vi.fn((p: string, data: string) => { mem[p.split(/[/\\]/).pop() as string] = data; }),
      unlinkSync: vi.fn((p: string) => { delete mem[p.split(/[/\\]/).pop() as string]; }),
      mkdirSync: vi.fn(),
    }));
    vi.doMock("path", () => ({
      join: (...parts: string[]) => parts.join("/"),
      dirname: (p: string) => p.split("/").slice(0, -1).join("/") || ".",
      basename: (p: string) => p.split(/[/\\]/).pop() as string,
    }));
    vi.doMock("electron", () => ({ app: { getPath: vi.fn(() => process.cwd()) } }));
    return mem;
  }

  it("loads empty list when file missing", async () => {
    // no initial backing file present
    mockFsLayer(undefined);
    const mod = await import(SUT);
    // ensure our env path is unique for this test, so no previous writes apply
    expect(mod.loadRecentFiles()).toEqual([]);
  });

  it("saves list capping to 10 and adds recent file to top", async () => {
    mockFsLayer([]);
    const mod = await import(SUT);
    const many = Array.from({ length: 12 }, (_, i) => `f${i}.fit`);
    mod.saveRecentFiles(many);
    const list = mod.loadRecentFiles();
    expect(list.length).toBe(10);

    mod.addRecentFile("new.fit");
    const afterAdd = mod.loadRecentFiles();
    expect(afterAdd[0]).toBe("new.fit");
  });

  it("getShortRecentName handles empty input and returns basename", async () => {
    mockFsLayer([]);
    const mod = await import(SUT);
    expect(mod.getShortRecentName("")).toBe("");
    expect(mod.getShortRecentName("C:/a/b/c.fit")).toBe("c.fit");
  });
});
