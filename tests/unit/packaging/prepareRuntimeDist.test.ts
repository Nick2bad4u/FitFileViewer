import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
    appAlternativeFitViewPath,
    appElevProfileCssPath,
    appIconsPath,
    appIndexHtmlPath,
    appStyleCssPath,
    rootStaticAssetsPath,
} from "../../../scripts/lib/workspaces.mjs";

type RuntimeCopyRoot = "app" | "static";

type RuntimeCopy = {
    destination: string;
    source: string;
    sourceRoot: RuntimeCopyRoot;
};

type PrepareRuntimeDistModule = {
    directoryCopies: RuntimeCopy[];
    fileCopies: RuntimeCopy[];
    prepareRuntimeDist: (options?: {
        appDir?: string;
        distDir?: string;
        staticDir?: string;
    }) => void;
};

const temporaryRoots: string[] = [];

async function importPrepareRuntimeDist(): Promise<PrepareRuntimeDistModule> {
    return (await import("../../../scripts/prepare-runtime-dist.mjs")) as PrepareRuntimeDistModule;
}

function makeTemporaryApp(): {
    appDir: string;
    distDir: string;
    staticDir: string;
} {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-runtime-app-")
    );
    temporaryRoots.push(temporaryRoot);

    const appDir = path.join(temporaryRoot, "electron-app");
    const staticDir = path.join(temporaryRoot, rootStaticAssetsPath);

    fs.mkdirSync(path.join(staticDir, appAlternativeFitViewPath, "assets"), {
        recursive: true,
    });
    fs.mkdirSync(appDir, { recursive: true });
    fs.mkdirSync(path.join(staticDir, "app"), { recursive: true });
    fs.mkdirSync(path.join(staticDir, appIconsPath), { recursive: true });
    fs.writeFileSync(
        path.join(staticDir, "app", appIndexHtmlPath),
        "<html></html>"
    );
    fs.writeFileSync(
        path.join(staticDir, appAlternativeFitViewPath, "index.html"),
        "<html></html>"
    );
    fs.writeFileSync(
        path.join(staticDir, appAlternativeFitViewPath, "assets", "app.js"),
        "app"
    );
    fs.writeFileSync(path.join(staticDir, appIconsPath, "favicon.ico"), "icon");
    fs.writeFileSync(
        path.join(staticDir, "app", appElevProfileCssPath),
        "profile"
    );
    fs.writeFileSync(path.join(staticDir, "app", appStyleCssPath), "style");

    return { appDir, distDir: path.join(appDir, "dist"), staticDir };
}

function getPathStates(
    root: string,
    relativePaths: string[]
): Record<string, "missing" | "present"> {
    return Object.fromEntries(
        relativePaths.map((relativePath) => [
            relativePath,
            fs.existsSync(path.join(root, relativePath))
                ? "present"
                : "missing",
        ])
    );
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("prepare-runtime-dist script", () => {
    it("copies static app assets into dist so electron-builder only needs dist/**", async () => {
        expect.assertions(3);

        const { directoryCopies, fileCopies, prepareRuntimeDist } =
            await importPrepareRuntimeDist();
        const { appDir, distDir, staticDir } = makeTemporaryApp();

        prepareRuntimeDist({ appDir, distDir, staticDir });

        expect(directoryCopies).toStrictEqual([
            {
                destination: appAlternativeFitViewPath,
                source: appAlternativeFitViewPath,
                sourceRoot: "static",
            },
            {
                destination: appIconsPath,
                source: appIconsPath,
                sourceRoot: "static",
            },
        ]);
        expect(fileCopies).toStrictEqual([
            {
                destination: appElevProfileCssPath,
                source: "app/elevProfile.css",
                sourceRoot: "static",
            },
            {
                destination: appStyleCssPath,
                source: "app/style.css",
                sourceRoot: "static",
            },
        ]);
        expect(
            getPathStates(distDir, [
                path.join(appAlternativeFitViewPath, "index.html"),
                path.join(appAlternativeFitViewPath, "assets", "app.js"),
                path.join(appIconsPath, "favicon.ico"),
            ])
        ).toStrictEqual({
            [path.join(appAlternativeFitViewPath, "assets", "app.js")]:
                "present",
            [path.join(appAlternativeFitViewPath, "index.html")]: "present",
            [path.join(appIconsPath, "favicon.ico")]: "present",
        });
    });

    it("rejects dist paths outside the app directory", async () => {
        expect.assertions(1);

        const { prepareRuntimeDist } = await importPrepareRuntimeDist();
        const { appDir, staticDir } = makeTemporaryApp();

        expect(() =>
            prepareRuntimeDist({
                appDir,
                distDir: path.join(appDir, "..", "outside-dist"),
                staticDir,
            })
        ).toThrow("Refusing to operate outside app directory");
    });

    it("rejects direct node_modules references in the runtime HTML", async () => {
        expect.assertions(1);

        const { prepareRuntimeDist } = await importPrepareRuntimeDist();
        const { appDir, distDir, staticDir } = makeTemporaryApp();

        fs.writeFileSync(
            path.join(staticDir, "app", appIndexHtmlPath),
            '<script src="./node_modules/leaflet/dist/leaflet.js"></script>'
        );

        expect(() =>
            prepareRuntimeDist({ appDir, distDir, staticDir })
        ).toThrow("index.html must not reference node_modules directly");
    });
});
