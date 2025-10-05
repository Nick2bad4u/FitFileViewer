/**
 * Electron Builder Configuration
 * @see https://www.electron.build/configuration/configuration
 */

module.exports = {
    appId: "com.example.fitfileviewer",
    productName: "Fit File Viewer",
    artifactName: `Fit-File-Viewer-\${platform}-\${arch}-\${version}.\${ext}`,

    directories: {
        output: "release",
        buildResources: "build-resources",
    },

    files: [
        "dist/**/*",
        "main.js",
        "preload.js",
        "fitParser.js",
        "windowStateUtils.js",
        "utils/**/*",
        "icons/**/*",
        "package.json",
        "!**/*.ts",
        "!**/*.map",
        "!tests/**/*",
        "!coverage/**/*",
        "!.cache/**/*",
    ],

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
        target: ["portable", "squirrel", "msi", "tar.xz", "tar.gz", "tar.bz2"],
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
        artifactName: `Fit-File-Viewer-nsis-\${arch}-\${version}.\${ext}`,
    },

    mac: {
        icon: "icons/favicon-512x512.icns",
        target: ["dmg", "zip", "pkg", "tar.xz", "tar.gz", "tar.bz2"],
        category: "public.app-category.productivity",
        hardenedRuntime: true,
        gatekeeperAssess: true,
    },

    linux: {
        icon: "icons/favicon-256x256.png",
        target: ["AppImage", "deb", "rpm", "snap", "tar.xz", "tar.gz", "tar.bz2"],
        category: "Utility",
        synopsis: "A cross-platform viewer for .fit activity files.",
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
