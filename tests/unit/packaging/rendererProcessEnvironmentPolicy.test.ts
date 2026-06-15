import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const DIRECT_PROCESS_ENV_PATTERN = /\bprocess\.env\b/u;
const RENDERER_DEVELOPMENT_DEBUG_GLOBALS =
    "electron-app/renderer/developmentDebugTools.ts";
const RENDERER_ENTRYPOINT = "electron-app/renderer.ts";

const SCANNED_SOURCE_PATHS = [
    "electron-app/main-ui.ts",
    "electron-app/preload",
    "electron-app/preload.ts",
    "electron-app/renderer",
    "electron-app/renderer.ts",
    "electron-app/ui",
    "electron-app/utils",
];

const EXCLUDED_RELATIVE_PATHS = new Set([
    "electron-app/utils/runtime/processEnvironment.ts",
]);

const SOURCE_EXTENSIONS = new Set([".js", ".ts"]);

function collectSourceFiles(relativePath: string): string[] {
    const absolutePath = path.join(process.cwd(), relativePath);
    const stat = statSync(absolutePath);

    if (!stat.isDirectory()) {
        if (!SOURCE_EXTENSIONS.has(path.extname(relativePath))) {
            return [];
        }

        const normalizedRelativePath = relativePath.replaceAll(path.sep, "/");
        return EXCLUDED_RELATIVE_PATHS.has(normalizedRelativePath)
            ? []
            : [normalizedRelativePath];
    }

    const entries = readdirSync(absolutePath);
    const sourceFiles: string[] = [];

    for (const entry of entries) {
        const absoluteEntry = path.join(absolutePath, entry);
        const relativeEntry = path
            .relative(process.cwd(), absoluteEntry)
            .replaceAll(path.sep, "/");
        const stat = statSync(absoluteEntry);

        if (stat.isDirectory()) {
            sourceFiles.push(...collectSourceFiles(relativeEntry));
            continue;
        }

        if (!SOURCE_EXTENSIONS.has(path.extname(entry))) {
            continue;
        }
        if (relativeEntry.endsWith(".test.ts")) {
            continue;
        }
        if (EXCLUDED_RELATIVE_PATHS.has(relativeEntry)) {
            continue;
        }

        sourceFiles.push(relativeEntry);
    }

    return sourceFiles;
}

describe("renderer process environment policy", () => {
    it("keeps renderer-adjacent source off direct process.env reads", () => {
        expect.assertions(3);

        const scannedSourceFiles =
            SCANNED_SOURCE_PATHS.flatMap(collectSourceFiles);
        const requiredScannedSourceFiles = [
            "electron-app/main-ui.ts",
            "electron-app/preload.ts",
            "electron-app/preload/electronBridge.ts",
            "electron-app/renderer.ts",
            "electron-app/renderer/rendererVendorChartData.ts",
            "electron-app/renderer/rendererVendorCore.ts",
            "electron-app/renderer/rendererVendorMap.ts",
            "electron-app/renderer/rendererVendorShared.ts",
            "electron-app/ui/modals/accentColorPicker.ts",
            "electron-app/utils/charts/core/renderChartRuntimeHelpers.ts",
        ];
        const directProcessEnvAccesses = scannedSourceFiles
            .map((relativeFile) => ({
                content: readFileSync(
                    path.join(process.cwd(), relativeFile),
                    "utf8"
                ),
                relativeFile,
            }))
            .filter(({ content }) => DIRECT_PROCESS_ENV_PATTERN.test(content))
            .map(({ relativeFile }) => relativeFile);

        expect(
            Object.fromEntries(
                requiredScannedSourceFiles.map((relativeFile) => [
                    relativeFile,
                    scannedSourceFiles.includes(relativeFile),
                ])
            )
        ).toStrictEqual(
            Object.fromEntries(
                requiredScannedSourceFiles.map((relativeFile) => [
                    relativeFile,
                    true,
                ])
            )
        );
        expect(scannedSourceFiles).not.toContain(
            "electron-app/utils/runtime/processEnvironment.ts"
        );
        expect(directProcessEnvAccesses).toStrictEqual([]);
    });

    it("keeps file-url runtime metadata away from navigator.cookieEnabled", () => {
        expect.assertions(4);

        const metadataSource = readFileSync(
            path.join(process.cwd(), RENDERER_DEVELOPMENT_DEBUG_GLOBALS),
            "utf8"
        );
        const cookieAccessIndex = metadataSource.indexOf('"cookieEnabled"');
        const httpProtocolGuardIndex = metadataSource.indexOf(
            'protocol === "http:"'
        );
        const httpsProtocolGuardIndex = metadataSource.indexOf(
            'protocol === "https:"'
        );

        expect(metadataSource).not.toContain("navigator.cookieEnabled");
        expect(cookieAccessIndex).toBeGreaterThan(-1);
        expect(httpProtocolGuardIndex).toBeLessThan(cookieAccessIndex);
        expect(httpsProtocolGuardIndex).toBeLessThan(cookieAccessIndex);
    });
});
