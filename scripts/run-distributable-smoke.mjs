import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    repositoryRoot,
    rootReleaseDistAbsolutePath,
} from "./lib/workspaces.mjs";
import {
    findPackagedElectronExecutable,
    runPackagedSmoke,
} from "./run-packaged-smoke.mjs";

// These are the artifacts users install or extract, rather than the builder's
// intermediate unpacked tree. Exact names prevent silently testing stale builds.
export function getDistributableNames({ platform, arch, version }) {
    assertValidVersion(version);
    const supported =
        {
            darwin: [
                "arm64",
                "x64",
                "universal",
            ],
            win32: ["x64", "ia32"],
            linux: ["x64"],
        }[platform] ?? [];
    if (!supported.includes(arch)) {
        throw new Error(
            `Unsupported distributable smoke platform/architecture: ${platform}/${arch}`
        );
    }
    if (platform === "darwin") {
        return [`Fit-File-Viewer-dmg-${arch}-${version}.dmg`];
    }
    if (platform === "win32") {
        return [
            `Fit-File-Viewer-msi-${arch}-${version}.zip`,
            `Fit-File-Viewer-nsis-${arch}-${version}.exe`,
            `Fit-File-Viewer-portable-${arch}-${version}.exe`,
        ];
    }
    return [
        `Fit-File-Viewer-linux-${arch}-${version}.tar.gz`,
        `Fit-File-Viewer-appimage-${arch === "x64" ? "x86_64" : arch}-${version}.AppImage`,
    ];
}

function assertValidVersion(version) {
    const separator = version.indexOf("-");
    const core = separator === -1 ? version : version.slice(0, separator);
    const prerelease =
        separator === -1 ? undefined : version.slice(separator + 1);
    if (
        !/^\d+\.\d+\.\d+$/u.test(core) ||
        (prerelease !== undefined && !/^[\dA-Za-z.-]+$/u.test(prerelease))
    ) {
        throw new Error(`Invalid package version: ${version}`);
    }
}

export function runChecked(command, args, options = {}, runner = spawnSync) {
    const result = runner(command, args, {
        encoding: "utf8",
        timeout: 300_000,
        ...options,
    });
    if (result.error) throw result.error;
    if (result.status !== 0 || result.signal) {
        throw new Error(
            `${command} failed (status ${result.status}, signal ${result.signal ?? "none"}):\n${result.stdout ?? ""}\n${result.stderr ?? ""}`
        );
    }
    return result;
}

export function getWindowsInstallRegistrations(run = runChecked) {
    const result = run("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-File",
        path.join(
            repositoryRoot,
            "scripts/get-windows-install-registrations.ps1"
        ),
    ]);
    const registrations = JSON.parse(result.stdout);
    if (!Array.isArray(registrations)) {
        throw new TypeError(
            "Windows installation registration inspection returned invalid data"
        );
    }
    return registrations;
}

export function assertNoWindowsInstallRegistrations(
    inspect = getWindowsInstallRegistrations
) {
    const registrations = inspect();
    if (registrations.length > 0) {
        throw new Error(
            `Refusing NSIS smoke installation: existing Fit File Viewer registration found. Use a clean disposable Windows runner. ${JSON.stringify(registrations)}`
        );
    }
}

export function runDistributableSmoke(
    {
        arch = process.env.MATRIX_ARCH ?? process.arch,
        platform = process.platform,
        version = JSON.parse(
            fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
        ).version,
        releaseDirectory = rootReleaseDistAbsolutePath,
        environment = process.env,
    } = {},
    dependencies = {}
) {
    const run = dependencies.run ?? runChecked;
    const smoke = dependencies.smoke ?? runPackagedSmoke;
    const inspectWindowsRegistrations =
        dependencies.inspectWindowsRegistrations ??
        getWindowsInstallRegistrations;
    const names = getDistributableNames({ platform, arch, version });
    const evidence = [];
    const reportPath = path.join(
        releaseDirectory,
        `distributable-smoke-${platform}-${arch}.json`
    );
    const writeReport = () => {
        fs.writeFileSync(
            reportPath,
            `${JSON.stringify({ version, platform, arch, artifacts: evidence }, null, 2)}\n`
        );
    };
    // Remove stale success evidence before doing any work.
    fs.rmSync(reportPath, { force: true });
    for (const name of names) {
        if (
            !fs
                .statSync(path.join(releaseDirectory, name), {
                    throwIfNoEntry: false,
                })
                ?.isFile()
        ) {
            const error = `Required distributable is missing: ${name}`;
            evidence.push({ artifact: name, passed: false, error });
            writeReport();
            throw new Error(error);
        }
    }
    for (const name of names) {
        const artifact = path.resolve(releaseDirectory, name);
        const directory = fs.mkdtempSync(
            path.join(tmpdir(), "ffv-distributable-")
        );
        let mounted = false;
        let installationAttempted = false;
        const mountpoint = path.join(directory, "volume");
        const destination = path.join(directory, "installed");
        fs.mkdirSync(destination);
        const cleanup = () => {
            let cleanupVerified = false;
            try {
                if (mounted) run("hdiutil", ["detach", mountpoint]);
                if (installationAttempted) {
                    const uninstaller = path.join(
                        destination,
                        "Uninstall Fit File Viewer.exe"
                    );
                    if (fs.existsSync(uninstaller))
                        run(uninstaller, [
                            "/S",
                            "/currentuser",
                            `_?=${destination}`,
                        ]);
                    // Do not remove files while an active registration points to
                    // them. Preserve partial installs for cleanup/diagnosis.
                    assertNoWindowsInstallRegistrations(
                        inspectWindowsRegistrations
                    );
                }
                cleanupVerified = true;
            } catch (error) {
                const message = `Distributable cleanup failed; preserved ${directory}: ${error instanceof Error ? error.message : String(error)}`;
                evidence.push({
                    artifact: name,
                    passed: false,
                    phase: "cleanup",
                    error: message,
                });
                writeReport();
                throw new Error(message, { cause: error });
            } finally {
                // The only recursive removal is our freshly-created temp directory.
                if (cleanupVerified)
                    fs.rmSync(directory, {
                        recursive: true,
                        force: true,
                        maxRetries: 5,
                        retryDelay: 500,
                    });
            }
        };
        try {
            console.log(`[distributable-smoke] Testing ${name}`);
            if (platform === "darwin") {
                run("hdiutil", [
                    "attach",
                    "-readonly",
                    "-nobrowse",
                    "-mountpoint",
                    mountpoint,
                    artifact,
                ]);
                mounted = true;
                run("ditto", [
                    path.join(mountpoint, "Fit File Viewer.app"),
                    path.join(destination, "Fit File Viewer.app"),
                ]);
                run("hdiutil", ["detach", mountpoint]);
                mounted = false;
                run("codesign", [
                    "--verify",
                    "--deep",
                    "--strict",
                    "--all-architectures",
                    "--verbose=2",
                    path.join(destination, "Fit File Viewer.app"),
                ]);
            } else if (platform === "win32" && name.includes("-nsis-")) {
                // /D only selects files. NSIS still upgrades the global app GUID,
                // and migration code can replace /D with an existing location.
                assertNoWindowsInstallRegistrations(
                    inspectWindowsRegistrations
                );
                installationAttempted = true;
                run(artifact, [
                    "/S",
                    "/currentuser",
                    `/D=${destination}`,
                ]);
            } else if (platform === "linux" && name.endsWith(".AppImage")) {
                fs.chmodSync(artifact, 0o755);
                run(artifact, ["--appimage-extract"], { cwd: destination });
            } else if (!name.includes("-portable-")) {
                run("tar", [
                    "-xf",
                    artifact,
                    "-C",
                    destination,
                ]);
            }
            const executable = name.includes("-portable-")
                ? artifact
                : findPackagedElectronExecutable({
                      releaseDistPath: destination,
                      platform,
                  });
            const architectures =
                platform === "darwin" && arch === "universal"
                    ? ["arm64", "x64"]
                    : [arch];
            for (const architecture of architectures) {
                let launchPath = executable;
                if (platform === "darwin") {
                    launchPath = path.join(
                        directory,
                        `launch-${architecture}.sh`
                    );
                    // Paths are generated locally, but quote them as shell data.
                    const quoted = `'${executable.replaceAll("'", String.raw`'\''`)}'`;
                    fs.writeFileSync(
                        launchPath,
                        `#!/bin/sh\nexec /usr/bin/arch -${architecture === "x64" ? "x86_64" : architecture} ${quoted} "$@"\n`,
                        { mode: 0o755 }
                    );
                }
                if (
                    smoke(["--executable", launchPath], {
                        ...environment,
                        FFV_SMOKE_EXPECTED_ARCH: architecture,
                        FFV_SMOKE_EXPECTED_VERSION: version,
                        FFV_SMOKE_DIAGNOSTICS_DIRECTORY: path.join(
                            releaseDirectory,
                            "smoke-diagnostics"
                        ),
                    }) !== 0
                ) {
                    throw new Error(
                        `Distributable smoke failed: ${name} (${architecture})`
                    );
                }
            }
            if (platform === "darwin") {
                const launchPath = path.join(directory, "launch-services.sh");
                const bundle = path.join(destination, "Fit File Viewer.app");
                const quoted = `'${bundle.replaceAll("'", String.raw`'\''`)}'`;
                fs.writeFileSync(
                    launchPath,
                    `#!/bin/sh\nexec /usr/bin/open -W -n -a ${quoted} --env "FFV_SMOKE_DIRECTORY=$FFV_SMOKE_DIRECTORY" --env "FFV_SMOKE_NONCE=$FFV_SMOKE_NONCE" --env "FFV_SMOKE_FIXTURE=$FFV_SMOKE_FIXTURE" --env NODE_ENV=production --env ELECTRON_IS_DEV=0 --env FFV_DISABLE_WEB_SECURITY=false --args "$@"\n`,
                    { mode: 0o755 }
                );
                if (
                    smoke(["--executable", launchPath], {
                        ...environment,
                        FFV_SMOKE_EXPECTED_ARCH:
                            arch === "universal" ? process.arch : arch,
                        FFV_SMOKE_EXPECTED_VERSION: version,
                        FFV_SMOKE_DIAGNOSTICS_DIRECTORY: path.join(
                            releaseDirectory,
                            "smoke-diagnostics"
                        ),
                    }) !== 0
                ) {
                    throw new Error(`LaunchServices smoke failed: ${name}`);
                }
            }
            evidence.push({
                artifact: name,
                architectures,
                sha256: createHash("sha256")
                    .update(fs.readFileSync(artifact))
                    .digest("hex"),
                signatureVerified: platform === "darwin",
                launchServicesVerified: platform === "darwin",
                passed: true,
            });
            writeReport();
        } catch (error) {
            evidence.push({
                artifact: name,
                passed: false,
                error: error instanceof Error ? error.message : String(error),
            });
            writeReport();
            throw error;
        } finally {
            cleanup();
        }
    }
    writeReport();
    console.log(
        `[distributable-smoke] Verified ${evidence.length} final artifacts; evidence: ${reportPath}`
    );
    return 0;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runDistributableSmoke();
}
