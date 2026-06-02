import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type Tsconfig = {
    compilerOptions?: {
        paths?: Record<string, string[]>;
    };
    exclude?: string[];
    include?: string[];
};

function readTsconfig(fileName: string): Tsconfig {
    return JSON.parse(
        readFileSync(path.join(process.cwd(), fileName), "utf8")
    ) as Tsconfig;
}

describe("typescript configuration policy", () => {
    it("does not point the app typecheck at removed electron-app source trees", () => {
        expect.assertions(8);

        const config = readTsconfig("tsconfig.app.json");
        const paths = config.compilerOptions?.paths ?? {};
        const includes = config.include ?? [];

        expect(paths).not.toHaveProperty("@app/*");
        expect(paths).not.toHaveProperty("@electron/*");
        expect(paths["@shared/*"]).toStrictEqual(["./electron-app/shared/*"]);
        expect(includes).toContain("global.d.ts");
        expect(includes).not.toContain("electron-app/global.d.ts");
        expect(includes).not.toContain("electron-app/src/**/*");
        expect(config.exclude ?? []).not.toContain("electron-app/electron");
        expect(
            includes.filter((entry) => entry.endsWith("global.d.ts"))
        ).toStrictEqual(["global.d.ts"]);
    });

    it("keeps Vitest declaration typecheck rooted in tests", () => {
        expect.assertions(4);

        const config = readTsconfig("tsconfig.vitest-typecheck.json");

        expect(config.include).toContain("tests/**/*.test-d.ts");
        expect(config.include).toContain("tests/**/*.spec-d.ts");
        expect(config.include).not.toContain(
            "electron-app/tests/**/*.test-d.ts"
        );
        expect(config.include).not.toContain("electron-app/index.d.ts");
    });
});
