import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type PrepareRuntimeDistModule = {
    directoryCopies: string[];
    fileCopies: string[];
    prepareRuntimeDist: (options?: {
        appDir?: string;
        distDir?: string;
    }) => void;
};

const temporaryRoots: string[] = [];

async function importPrepareRuntimeDist(): Promise<PrepareRuntimeDistModule> {
    return (await import("../../../scripts/prepare-runtime-dist.mjs")) as PrepareRuntimeDistModule;
}

function makeTemporaryApp(): { appDir: string; distDir: string } {
    const appDir = fs.mkdtempSync(path.join(os.tmpdir(), "ffv-runtime-app-"));
    temporaryRoots.push(appDir);

    fs.mkdirSync(path.join(appDir, "ffv", "assets"), { recursive: true });
    fs.mkdirSync(path.join(appDir, "icons"), { recursive: true });
    fs.writeFileSync(path.join(appDir, "index.html"), "<html></html>");
    fs.writeFileSync(path.join(appDir, "ffv", "index.html"), "<html></html>");
    fs.writeFileSync(path.join(appDir, "ffv", "assets", "app.js"), "app");
    fs.writeFileSync(path.join(appDir, "icons", "favicon.ico"), "icon");
    fs.writeFileSync(path.join(appDir, "elevProfile.css"), "profile");
    fs.writeFileSync(path.join(appDir, "style.css"), "style");

    return { appDir, distDir: path.join(appDir, "dist") };
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("prepare-runtime-dist script", () => {
    it("copies static app assets into dist so electron-builder only needs dist/**", async () => {
        expect.assertions(5);

        const { directoryCopies, fileCopies, prepareRuntimeDist } =
            await importPrepareRuntimeDist();
        const { appDir, distDir } = makeTemporaryApp();

        prepareRuntimeDist({ appDir, distDir });

        expect(directoryCopies).toStrictEqual(["ffv", "icons"]);
        expect(fileCopies).toStrictEqual(["elevProfile.css", "style.css"]);
        expect(fs.existsSync(path.join(distDir, "ffv", "index.html"))).toBe(
            true
        );
        expect(
            fs.existsSync(path.join(distDir, "ffv", "assets", "app.js"))
        ).toBe(true);
        expect(fs.existsSync(path.join(distDir, "icons", "favicon.ico"))).toBe(
            true
        );
    });

    it("rejects dist paths outside the app directory", async () => {
        expect.assertions(1);

        const { prepareRuntimeDist } = await importPrepareRuntimeDist();
        const { appDir } = makeTemporaryApp();

        expect(() =>
            prepareRuntimeDist({
                appDir,
                distDir: path.join(appDir, "..", "outside-dist"),
            })
        ).toThrow("Refusing to operate outside electron-app");
    });
});
