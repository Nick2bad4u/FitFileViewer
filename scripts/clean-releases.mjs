import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot } from "./lib/workspaces.mjs";

export const defaultKeepLast = 5;

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const parsedArgs = parseArgs(process.argv.slice(2));

    if (parsedArgs.help) {
        printUsage();
    } else {
        cleanReleases(parsedArgs);
    }
}

export function cleanReleases(options) {
    const releases = loadReleases(options);
    const plan = createCleanupPlan(releases, options.keepLast);

    printCleanupPlan(plan, options);

    if (plan.releasesToDelete.length === 0) {
        console.log("[clean-releases] No releases to delete.");
        return;
    }

    if (!options.yes) {
        console.log(
            "[clean-releases] Dry run only. Re-run with --yes to delete releases."
        );
        return;
    }

    deletePlannedReleases(plan.releasesToDelete, options);

    if (options.deleteTags) {
        deleteOrphanTags();
    }

    console.log("[clean-releases] Deletion complete.");
}

export function createCleanupPlan(releases, keepLast) {
    const sortedReleases = releases
        .filter(isValidRelease)
        .map((release) => ({
            publishedAt: release.publishedAt,
            publishedAtTime: Date.parse(release.publishedAt),
            tagName: release.tagName,
        }))
        .sort((left, right) => left.publishedAtTime - right.publishedAtTime);

    const firstMajorTags = new Map();

    for (const release of sortedReleases) {
        const majorMatch = /^v?(\d+)\./u.exec(release.tagName);

        if (majorMatch && !firstMajorTags.has(majorMatch[1])) {
            firstMajorTags.set(majorMatch[1], release.tagName);
        }
    }

    const keepTags = new Set([
        ...firstMajorTags.values(),
        ...sortedReleases.slice(-keepLast).map((release) => release.tagName),
    ]);
    const releasesToDelete = sortedReleases.filter(
        (release) => !keepTags.has(release.tagName)
    );

    return {
        keepTags: [...keepTags].sort(),
        releasesToDelete,
        sortedReleases,
    };
}

function deleteOrphanTags() {
    const releaseTags = new Set(
        loadReleases({ releasesJsonPath: undefined })
            .filter((release) => typeof release.tagName === "string")
            .flatMap((release) => {
                const normalizedTag = release.tagName.trim().toLowerCase();

                return [normalizedTag, normalizedTag.replace(/^v/u, "")];
            })
    );
    const localTags = captureCommand("git", ["tag", "--list"])
        .split(/\r?\n/u)
        .map((tag) => tag.trim())
        .filter(Boolean);
    const orphanTags = localTags.filter((tag) => {
        const normalizedTag = tag.toLowerCase();

        return (
            !releaseTags.has(normalizedTag) &&
            !releaseTags.has(normalizedTag.replace(/^v/u, ""))
        );
    });

    if (orphanTags.length === 0) {
        console.log("[clean-releases] No orphan tags found.");
        return;
    }

    console.log("[clean-releases] Deleting orphan tags with no release:");
    printList(orphanTags);

    for (const tag of orphanTags) {
        runCommand(
            "git",
            [
                "tag",
                "-d",
                tag,
            ],
            { allowFailure: true }
        );
        runCommand(
            "git",
            [
                "push",
                "origin",
                `:refs/tags/${tag}`,
            ],
            {
                allowFailure: true,
            }
        );
    }
}

function deletePlannedReleases(releasesToDelete, options) {
    for (const release of releasesToDelete) {
        console.log(`[clean-releases] Deleting release ${release.tagName}...`);
        runCommand(
            "gh",
            [
                "release",
                "delete",
                release.tagName,
                "--yes",
            ],
            {
                allowFailure: true,
            }
        );

        if (options.deleteTags) {
            console.log(`[clean-releases] Deleting tag ${release.tagName}...`);
            runCommand(
                "git",
                [
                    "tag",
                    "-d",
                    release.tagName,
                ],
                {
                    allowFailure: true,
                }
            );
            runCommand(
                "git",
                [
                    "push",
                    "origin",
                    `:refs/tags/${release.tagName}`,
                ],
                { allowFailure: true }
            );
        }
    }
}

function captureCommand(command, args) {
    const result = spawnSync(command, args, {
        cwd: repositoryRoot,
        encoding: "utf8",
        env: process.env,
        stdio: [
            "ignore",
            "pipe",
            "inherit",
        ],
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(
            `Command failed with status ${result.status}: ${command} ${args.join(" ")}`
        );
    }

    return result.stdout;
}

export function isValidRelease(release) {
    return Boolean(
        release &&
        typeof release === "object" &&
        typeof release.tagName === "string" &&
        release.tagName.trim() !== "" &&
        typeof release.publishedAt === "string" &&
        Number.isFinite(Date.parse(release.publishedAt))
    );
}

function loadReleases(options) {
    if (options.releasesJsonPath) {
        const releasesPath = path.resolve(
            repositoryRoot,
            options.releasesJsonPath
        );
        const releases = JSON.parse(fs.readFileSync(releasesPath, "utf8"));

        if (!Array.isArray(releases)) {
            throw new TypeError(
                `Expected release JSON to contain an array: ${releasesPath}`
            );
        }

        return releases;
    }

    return JSON.parse(
        captureCommand("gh", [
            "release",
            "list",
            "--limit",
            "1000",
            "--json",
            "tagName,publishedAt",
        ])
    );
}

export function parseArgs(args) {
    const parsed = {
        deleteTags: false,
        help: false,
        keepLast: defaultKeepLast,
        releasesJsonPath: undefined,
        yes: false,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--help" || arg === "-h") {
            parsed.help = true;
            continue;
        }

        if (arg === "--delete-tags") {
            parsed.deleteTags = true;
            continue;
        }

        if (arg === "--yes") {
            parsed.yes = true;
            continue;
        }

        if (arg === "--keep-last") {
            parsed.keepLast = parseKeepLast(args[index + 1]);
            index += 1;
            continue;
        }

        if (arg.startsWith("--keep-last=")) {
            parsed.keepLast = parseKeepLast(arg.slice("--keep-last=".length));
            continue;
        }

        if (arg === "--releases-json") {
            parsed.releasesJsonPath = parseRequiredValue(arg, args[index + 1]);
            index += 1;
            continue;
        }

        if (arg.startsWith("--releases-json=")) {
            parsed.releasesJsonPath = parseRequiredValue(
                "--releases-json",
                arg.slice("--releases-json=".length)
            );
            continue;
        }

        throw new TypeError(`Unknown clean-releases argument: ${arg}`);
    }

    if (parsed.yes && parsed.releasesJsonPath) {
        throw new TypeError("--yes cannot be combined with --releases-json");
    }

    return parsed;
}

function parseKeepLast(value) {
    const keepLast = Number(value);

    if (!Number.isInteger(keepLast) || keepLast < 1) {
        throw new TypeError(
            `--keep-last must be a positive integer, received: ${value}`
        );
    }

    return keepLast;
}

function parseRequiredValue(name, value) {
    if (!value || value.startsWith("-")) {
        throw new TypeError(`${name} requires a value`);
    }

    return value;
}

function printCleanupPlan(plan, options) {
    console.log(
        `[clean-releases] Total valid releases: ${plan.sortedReleases.length}`
    );
    console.log(`[clean-releases] Keeping last ${options.keepLast} releases.`);
    console.log(
        `[clean-releases] Delete tags: ${options.deleteTags ? "yes" : "no"}`
    );
    console.log("[clean-releases] Tags kept:");
    printList(plan.keepTags);
    console.log("[clean-releases] Releases selected for deletion:");
    printList(plan.releasesToDelete.map((release) => release.tagName));
}

function printList(values) {
    if (values.length === 0) {
        console.log("  (none)");
        return;
    }

    for (const value of values) {
        console.log(`  - ${value}`);
    }
}

function printUsage() {
    console.log(`Usage: node scripts/clean-releases.mjs [options]

Options:
  --keep-last <count>       Number of most recent releases to keep. Defaults to ${defaultKeepLast}.
  --delete-tags             Also delete git tags for removed releases and orphan tags.
  --yes                     Apply deletions. Without this, the script only prints a dry-run plan.
  --releases-json <path>    Read release JSON from a file for dry-run validation.
  --help                    Show this help text.`);
}

function runCommand(command, args, options = {}) {
    const result = spawnSync(command, args, {
        cwd: repositoryRoot,
        env: process.env,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0 && !options.allowFailure) {
        throw new Error(
            `Command failed with status ${result.status}: ${command} ${args.join(" ")}`
        );
    }
}
