import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

type AppPackage = {
    appid: string;
    copyright: string;
    exports: Record<string, string>;
    icon: string;
    maintainers: [{ email: string; name: string }];
    productName: string;
};

type ElectronBuilderConfig = {
    appId: string;
    copyright: string;
    forceCodeSigning: boolean;
    icon: string;
    linux: {
        icon: string;
        maintainer: string;
    };
    mac: {
        icon: string;
    };
    productName: string;
    win: {
        icon: string;
        signExecutable: boolean;
    };
};

function toDistPath(exportPath: string): string {
    return exportPath.replace(/^\.\//u, "");
}

function loadAppPackage(): AppPackage {
    return JSON.parse(
        readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    ) as AppPackage;
}

describe("electron-builder config", () => {
    function loadBuilderConfig(
        requireCodeSigning?: string
    ): ElectronBuilderConfig {
        const childEnvironment = { ...process.env };
        if (requireCodeSigning === undefined) {
            delete childEnvironment.REQUIRE_CODE_SIGNING;
        } else {
            childEnvironment.REQUIRE_CODE_SIGNING = requireCodeSigning;
        }
        const serializedConfig = execFileSync(
            process.execPath,
            [
                "--input-type=module",
                "--eval",
                'const config = (await import("./electron-builder.config.cjs")).default; console.log(JSON.stringify(config));',
            ],
            {
                cwd: process.cwd(),
                encoding: "utf8",
                env: childEnvironment,
            }
        );

        return JSON.parse(serializedConfig) as ElectronBuilderConfig;
    }

    it("uses the root app package as the app identity source", () => {
        expect.assertions(11);

        const appPackage = loadAppPackage();
        const builderConfig = loadBuilderConfig();
        const [maintainer] = appPackage.maintainers;

        expect(builderConfig.appId).toBe(appPackage.appid);
        expect(builderConfig.productName).toBe(appPackage.productName);
        expect(builderConfig.copyright).toBe(appPackage.copyright);
        expect(builderConfig.icon).toBe(appPackage.icon);
        expect(builderConfig.win.icon).toBe(
            toDistPath(appPackage.exports["./icons/favicon-256x256.ico"])
        );
        expect(builderConfig.mac.icon).toBe(
            toDistPath(appPackage.exports["./icons/favicon-512x512.icns"])
        );
        expect(builderConfig.linux.icon).toBe(
            toDistPath(appPackage.exports["./icons/favicon-256x256.png"])
        );
        expect(builderConfig.linux.maintainer).toBe(
            `${maintainer.name} <${maintainer.email}>`
        );
        expect(builderConfig.forceCodeSigning).toBe(false);
        expect(builderConfig.win.signExecutable).toBe(false);
        expect(builderConfig.productName).not.toBe("FitFileViewer");
    });

    it("requires code signing when the release build environment enables it", () => {
        expect.assertions(2);

        const builderConfig = loadBuilderConfig("true");

        expect(builderConfig.forceCodeSigning).toBe(true);
        expect(builderConfig.win.signExecutable).toBe(true);
    });
});
