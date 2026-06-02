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
        distDir?: string;
        repositoryDir?: string;
        staticDir?: string;
    }) => void;
};

const temporaryRoots: string[] = [];

async function importPrepareRuntimeDist(): Promise<PrepareRuntimeDistModule> {
    return (await import("../../../scripts/prepare-runtime-dist.mjs")) as PrepareRuntimeDistModule;
}

function makeTemporaryApp(): {
    distDir: string;
    repositoryDir: string;
    staticDir: string;
} {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-runtime-app-")
    );
    temporaryRoots.push(temporaryRoot);

    const staticDir = temporaryRoot;

    fs.mkdirSync(path.join(staticDir, rootAlternativeFitViewPath, "assets"), {
        recursive: true,
    });
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

    return {
        distDir: path.join(temporaryRoot, "dist"),
        repositoryDir: temporaryRoot,
        staticDir,
    };
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
        const { distDir, repositoryDir, staticDir } = makeTemporaryApp();

        prepareRuntimeDist({ distDir, repositoryDir, staticDir });

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

    it("rejects dist paths outside the repository", async () => {
        expect.assertions(2);

        const { prepareRuntimeDist } = await importPrepareRuntimeDist();
        const { repositoryDir, staticDir } = makeTemporaryApp();
        const distDir = path.join(repositoryDir, "..", "outside-dist");

        expect(() =>
            prepareRuntimeDist({
                distDir,
                repositoryDir,
                staticDir,
            })
        ).toThrow("Refusing to operate outside");
        expect(
            getPathStates(path.dirname(repositoryDir), [
                "outside-dist",
                path.join(path.basename(repositoryDir), "dist"),
            ])
        ).toStrictEqual({
            [path.join(path.basename(repositoryDir), "dist")]: "missing",
            "outside-dist": "missing",
        });
    });

    it("rejects direct node_modules references in the runtime HTML", async () => {
        expect.assertions(1);

        const { prepareRuntimeDist } = await importPrepareRuntimeDist();
        const { distDir, repositoryDir, staticDir } = makeTemporaryApp();

        fs.writeFileSync(
            path.join(staticDir, rootAppIndexHtmlPath),
            '<script src="./node_modules/leaflet/dist/leaflet.js"></script>'
        );

        expect(() =>
            prepareRuntimeDist({ distDir, repositoryDir, staticDir })
        ).toThrow("index.html must not reference node_modules directly");
    });
});
