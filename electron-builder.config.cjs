// Electron Builder config is rooted here so packaging is managed from the workspace root.
/**
 * @typedef {object} PackagePerson
 *
 * @property {string} [email]
 * @property {string} name
 */

/**
 * @typedef {object} AppPackage
 *
 * @property {string} appid
 * @property {string} author
 * @property {string} copyright
 * @property {Record<string, string>} exports
 * @property {string} icon
 * @property {PackagePerson[]} maintainers
 * @property {string} productName
 */

const { version: electronVersion } = require("electron/package.json");

const appPackage = /** @type {AppPackage} */ (require("./package.json"));

const rootPackageFiles = ["dist/**", "package.json"];
// Version 29 and earlier derived this GUID from com.example.fitfileviewer. Keep it
// stable so existing NSIS installs remain discoverable after the appId change.
const legacyWindowsInstallerGuid = "141b3184-244b-5640-abaf-338415dd90dc";
const shouldCodeSign = isEnvironmentFlagEnabled(
    process.env.REQUIRE_CODE_SIGNING
);

/**
 * Apply Electron fuses during electron-builder's afterPack lifecycle so signed
 * builds mutate the executable before signing/artifact creation, not after.
 *
 * @param {unknown} context
 *
 * @returns {Promise<void>}
 */
async function applyElectronFusesAfterPack(context) {
    const { applyElectronFuses, getElectronBuilderAfterPackExecutablePath } =
        await import("./scripts/apply-electron-fuses.mjs");

    await applyElectronFuses({
        executablePaths: [getElectronBuilderAfterPackExecutablePath(context)],
    });
}

/**
 * @param {string} exportName
 *
 * @returns {string}
 */
function appPackageExportPath(exportName) {
    const exportPath = appPackage.exports[exportName];
    if (typeof exportPath !== "string" || !exportPath.startsWith("./")) {
        throw new Error(`Missing app package export path for ${exportName}`);
    }

    return exportPath.slice(2);
}

/**
 * @param {PackagePerson | undefined} person
 *
 * @returns {string}
 */
function formatPackagePerson(person) {
    if (!person || typeof person !== "object") {
        return appPackage.author;
    }

    return typeof person.email === "string" && person.email.length > 0
        ? `${person.name} <${person.email}>`
        : person.name;
}

function isEnvironmentFlagEnabled(value) {
    if (typeof value !== "string") {
        return false;
    }

    return [
        "1",
        "true",
        "yes",
    ].includes(value.toLowerCase());
}

module.exports = {
    electronVersion,
    icon: appPackage.icon,
    directories: {
        output: "release-dist",
    },
    files: rootPackageFiles,
    appId: appPackage.appid,
    productName: appPackage.productName,
    copyright: appPackage.copyright,
    forceCodeSigning: shouldCodeSign,
    artifactName: "Fit-File-Viewer-${platform}-${arch}-${version}.${ext}",
    afterPack: applyElectronFusesAfterPack,
    asar: true,
    publish: [
        {
            provider: "github",
            owner: "Nick2bad4u",
            repo: "FitFileViewer",
        },
    ],
    win: {
        icon: appPackageExportPath("./icons/favicon-256x256.ico"),
        signExecutable: shouldCodeSign,
        target: [
            "nsis",
            "nsis-web",
            "portable",
            "squirrel",
            "msi",
            "zip",
            "7z",
            "tar.xz",
            "tar.gz",
            "tar.bz2",
        ],
        legalTrademarks: "Fit File Viewer",
        requestedExecutionLevel: "asInvoker",
    },
    nsis: {
        guid: legacyWindowsInstallerGuid,
        include: "packaging/nsis/installer-migration.nsh",
        oneClick: false,
        allowElevation: true,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        runAfterFinish: true,
        artifactName: "Fit-File-Viewer-nsis-${arch}-${version}.${ext}",
    },
    nsisWeb: {
        artifactName: "Fit-File-Viewer-nsis-web-${arch}-${version}.${ext}",
    },
    portable: {
        artifactName: "Fit-File-Viewer-portable-${arch}-${version}.${ext}",
    },
    squirrelWindows: {
        artifactName: "Fit-File-Viewer-squirrel-${arch}-${version}.${ext}",
    },
    msi: {
        artifactName: "Fit-File-Viewer-msi-${arch}-${version}.${ext}",
    },
    appImage: {
        artifactName: "Fit-File-Viewer-appimage-${arch}-${version}.${ext}",
    },
    deb: {
        artifactName: "Fit-File-Viewer-deb-${arch}-${version}.${ext}",
    },
    rpm: {
        artifactName: "Fit-File-Viewer-rpm-${arch}-${version}.${ext}",
    },
    snap: {
        artifactName: "Fit-File-Viewer-snap-${arch}-${version}.${ext}",
    },
    freebsd: {
        artifactName: "Fit-File-Viewer-freebsd-${arch}-${version}.${ext}",
    },
    pacman: {
        artifactName: "Fit-File-Viewer-pacman-${arch}-${version}.${ext}",
    },
    p5p: {
        artifactName: "Fit-File-Viewer-p5p-${arch}-${version}.${ext}",
    },
    apk: {
        artifactName: "Fit-File-Viewer-apk-${arch}-${version}.${ext}",
    },
    dmg: {
        artifactName: "Fit-File-Viewer-dmg-${arch}-${version}.${ext}",
    },
    pkg: {
        artifactName: "Fit-File-Viewer-pkg-${arch}-${version}.${ext}",
    },
    flatpak: {
        artifactName: "Fit-File-Viewer-flatpak-${arch}-${version}.${ext}",
    },
    mac: {
        icon: appPackageExportPath("./icons/favicon-512x512.icns"),
        target: [
            "dmg",
            "zip",
            "pkg",
            "tar.xz",
            "tar.gz",
            "tar.bz2",
        ],
        category: "public.app-category.productivity",
        hardenedRuntime: true,
        gatekeeperAssess: true,
    },
    linux: {
        icon: appPackageExportPath("./icons/favicon-256x256.png"),
        target: [
            "AppImage",
            "deb",
            "rpm",
            "snap",
            "freebsd",
            "pacman",
            "apk",
            "zip",
            "tar.xz",
            "tar.gz",
            "tar.bz2",
        ],
        category: "Utility",
        synopsis: "A cross-platform viewer for .fit activity files.",
        maintainer: formatPackagePerson(appPackage.maintainers[0]),
        desktop: {
            entry: {
                Name: "Fit File Viewer",
                Comment: "View and analyze .fit activity files",
                Categories: "Utility;Sports;",
            },
        },
    },
    fileAssociations: [
        {
            ext: "fit",
            name: "Flexible and Interoperable Data Transfer File",
            description: ".fit activity file",
            role: "Viewer",
        },
    ],
};
