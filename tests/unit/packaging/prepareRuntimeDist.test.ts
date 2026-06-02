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
    rootAlternativeFitViewPath,
    rootAppElevProfileCssPath,
    rootAppIconsPath,
    rootAppIndexHtmlPath,
    rootAppStyleCssPath,
    rootStaticAssetsPath,
} from "../../../scripts/lib/workspaces.mjs";

type RuntimeCopy = {
    destination: string;
    source: string;
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
    const staticDir = temporaryRoot;

    fs.mkdirSync(path.join(staticDir, rootAlternativeFitViewPath, "assets"), {
        recursive: true,
    });
    fs.mkdirSync(appDir, { recursive: true });
    fs.mkdirSync(path.join(staticDir, rootStaticAssetsPath, "app"), {
        recursive: true,
    });
    fs.mkdirSync(path.join(staticDir, rootAppIconsPath), { recursive: true });
    fs.writeFileSync(
        path.join(staticDir, rootAppIndexHtmlPath),
        "<html></html>"
    );
    fs.writeFileSync(
        path.join(staticDir, rootAlternativeFitViewPath, "index.html"),
        "<html></html>"
    );
    fs.writeFileSync(
        path.join(staticDir, rootAlternativeFitViewPath, "assets", "app.js"),
        "app"
    );
    fs.writeFileSync(
        path.join(staticDir, rootAppIconsPath, "favicon.ico"),
        "icon"
    );
    fs.writeFileSync(
        path.join(staticDir, rootAppElevProfileCssPath),
        "profile"
    );
    fs.writeFileSync(path.join(staticDir, rootAppStyleCssPath), "style");

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
                source: rootAlternativeFitViewPath,
            },
            {
                destination: appIconsPath,
                source: rootAppIconsPath,
            },
        ]);
        expect(fileCopies).toStrictEqual([
            {
                destination: appElevProfileCssPath,
                source: rootAppElevProfileCssPath,
            },
            {
                destination: appStyleCssPath,
                source: rootAppStyleCssPath,
            },
        ]);
        expect(
            getPathStates(distDir, [
                path.join(appAlternativeFitViewPath, "index.html"),
                path.join(appAlternativeFitViewPath, "assets", "app.js"),
                appElevProfileCssPath,
                path.join(appIconsPath, "favicon.ico"),
                appIndexHtmlPath,
                appStyleCssPath,
            ])
        ).toStrictEqual({
            [path.join(appAlternativeFitViewPath, "assets", "app.js")]:
                "present",
            [path.join(appAlternativeFitViewPath, "index.html")]: "present",
            [appElevProfileCssPath]: "present",
            [path.join(appIconsPath, "favicon.ico")]: "present",
            [appIndexHtmlPath]: "present",
            [appStyleCssPath]: "present",
        });
    });

    it("rejects dist paths outside the app directory", async () => {
        expect.assertions(2);

        const { prepareRuntimeDist } = await importPrepareRuntimeDist();
        const { appDir, staticDir } = makeTemporaryApp();
        const distDir = path.join(appDir, "..", "outside-dist");

        expect(() =>
            prepareRuntimeDist({
                appDir,
                distDir,
                staticDir,
            })
        ).toThrow("Refusing to operate outside app directory");
        expect(
            getPathStates(path.dirname(appDir), [
                "outside-dist",
                path.join("electron-app", "dist"),
            ])
        ).toStrictEqual({
            [path.join("electron-app", "dist")]: "missing",
            "outside-dist": "missing",
        });
    });

    it("rejects direct node_modules references in the runtime HTML", async () => {
        expect.assertions(1);

        const { prepareRuntimeDist } = await importPrepareRuntimeDist();
        const { appDir, distDir, staticDir } = makeTemporaryApp();

        fs.writeFileSync(
            path.join(staticDir, rootAppIndexHtmlPath),
            '<script src="./node_modules/leaflet/dist/leaflet.js"></script>'
        );

        expect(() =>
            prepareRuntimeDist({ appDir, distDir, staticDir })
        ).toThrow("index.html must not reference node_modules directly");
    });
});
