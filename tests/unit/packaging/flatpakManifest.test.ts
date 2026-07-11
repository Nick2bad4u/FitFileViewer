import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Flatpak manifest", () => {
    it("packages the complete Electron runtime behind an explicit app launcher", () => {
        expect.assertions(8);

        const manifest = readFileSync(
            path.join(process.cwd(), "flatpak-build.yml"),
            "utf8"
        );

        expect(manifest).toContain("command: fitfileviewer");
        expect(manifest).toContain(
            "cp -a ./node_modules/electron/dist/. /app/lib/electron/"
        );
        expect(manifest).toContain("rm -rf /app/node_modules/electron/dist");
        expect(manifest).toContain(
            '/app/lib/electron/electron --no-sandbox /app "$@"'
        );
        expect(manifest).toContain("chmod 0755 /app/bin/fitfileviewer");
        expect(manifest).not.toContain(
            "install -Dm755 ./node_modules/electron/dist/electron"
        );
        expect(manifest).toContain('runtime-version: "25.08"');
        expect(manifest).not.toContain('runtime-version: "23.08"');
    });
});
