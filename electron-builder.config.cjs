// Electron Builder config is rooted here so packaging is managed from the workspace root.
const { version: electronVersion } = require("electron/package.json");

module.exports = {
    electronVersion,
    icon: "icons/favicon.ico",
    directories: {
        output: "release",
    },
    files: [
        "dist/**",
        "elevProfile.css",
        "icons/**",
        "index.html",
        "package.json",
        "style.css",
    ],
    appId: "io.github.nick2bad4u.fitfileviewer",
    artifactName: "Fit-File-Viewer-${platform}-${arch}-${version}.${ext}",
    asar: true,
    publish: [
        {
            provider: "github",
            owner: "Nick2bad4u",
            repo: "FitFileViewer",
        },
    ],
    win: {
        icon: "icons/favicon-256x256.ico",
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
        icon: "icons/favicon-512x512.icns",
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
        icon: "icons/favicon-256x256.png",
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
        maintainer: "Nick2bad4u <20943337+Nick2bad4u@users.noreply.github.com>",
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
