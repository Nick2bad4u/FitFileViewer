import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

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
        signAndEditExecutable: boolean;
    };
};

function toDistPath(exportPath: string): string {
    return exportPath.replace(/^\.\//u, "");
}

describe("electron-builder config", () => {
    function loadBuilderConfig(): ElectronBuilderConfig {
        const configPath =
            require.resolve("../../../electron-builder.config.cjs");
        delete require.cache[configPath];

        return require("../../../electron-builder.config.cjs") as ElectronBuilderConfig;
    }

    it("uses the root app package as the app identity source", () => {
        expect.assertions(11);

        const appPackage = require("../../../package.json") as AppPackage;
        const previousValue = process.env.REQUIRE_CODE_SIGNING;
        delete process.env.REQUIRE_CODE_SIGNING;
        const builderConfig = loadBuilderConfig();
        const [maintainer] = appPackage.maintainers;

        if (previousValue !== undefined) {
            process.env.REQUIRE_CODE_SIGNING = previousValue;
        }

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
        expect(builderConfig.win.signAndEditExecutable).toBe(false);
        expect(builderConfig.productName).not.toBe("FitFileViewer");
    });

    it("requires code signing when the release build environment enables it", () => {
        expect.assertions(2);

        const previousValue = process.env.REQUIRE_CODE_SIGNING;

        process.env.REQUIRE_CODE_SIGNING = "true";

        try {
            expect(loadBuilderConfig().forceCodeSigning).toBe(true);
            expect(loadBuilderConfig().win.signAndEditExecutable).toBe(true);
        } finally {
            if (previousValue === undefined) {
                delete process.env.REQUIRE_CODE_SIGNING;
            } else {
                process.env.REQUIRE_CODE_SIGNING = previousValue;
            }
        }
    });
});
