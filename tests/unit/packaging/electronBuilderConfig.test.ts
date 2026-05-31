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
    };
};

function toDistPath(exportPath: string): string {
    return exportPath.replace(/^\.\//u, "");
}

describe("electron-builder config", () => {
    it("uses the root app package as the app identity source", () => {
        expect.assertions(9);

        const appPackage = require("../../../package.json") as AppPackage;
        const builderConfig =
            require("../../../electron-builder.config.cjs") as ElectronBuilderConfig;
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
        expect(builderConfig.productName).not.toBe("FitFileViewer");
    });
});
