import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
    repositoryRoot,
    rootChangelogPath,
    rootCliffConfigPath,
} from "./lib/workspaces.mjs";

const gitCliffCliPath = fileURLToPath(
    await import.meta.resolve("git-cliff/cli")
);
const githubRepository = "Nick2bad4u/FitFileViewer";

export const currentReleaseChangelogBody = [
    '{% if version %}## [{{ version | trim_start_matches(pat="v") }}] - {{ timestamp | date(format="%Y-%m-%d") }}{% endif %}',
    '{% for group, commits in commits | group_by(attribute="group") %}',
    "### {{ group | striptags | trim | upper_first }}",
    String.raw`{% for commit in commits %}{% set message_lines = commit.message | split(pat="\n") %}`,
    '- [`{{ commit.id | truncate(length=7, end="") }}`](https://github.com/{{ remote.github.owner }}/{{ remote.github.repo }}/commit/{{ commit.id }}) {{ message_lines | first | upper_first }}',
    "{% endfor %}{% endfor %}",
].join("\n");

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        runChangelogWorkflow(options);
    }
}

export function createChangelogMetadata(cwd = repositoryRoot) {
    const changelogPath = path.join(cwd, rootChangelogPath);

    if (!fs.existsSync(changelogPath)) {
        return {
            exists: false,
            lineCount: 0,
            path: rootChangelogPath,
            size: "file not found",
        };
    }

    const contents = fs.readFileSync(changelogPath, "utf8");

    return {
        exists: true,
        lineCount: contents ? contents.split(/\r?\n/).length : 0,
        path: rootChangelogPath,
        size: String(fs.statSync(changelogPath).size),
    };
}

export function createDirectoryListing(cwd = repositoryRoot) {
    return fs
        .readdirSync(cwd, { withFileTypes: true })
        .map((entry) => ({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
}

export function formatChangelogMetadata(metadata) {
    if (!metadata.exists) {
        return `Root ${rootChangelogPath} generated, size: file not found`;
    }

    return `Root ${rootChangelogPath} generated, size: ${metadata.size}, lines: ${metadata.lineCount}`;
}

export function formatDirectoryListing(entries) {
    return entries
        .map(
            (entry) => `${entry.type === "directory" ? "d" : "-"} ${entry.name}`
        )
        .join("\n");
}

export function parseArgs(args) {
    const options = {
        help: false,
        verbose: true,
    };

    for (const arg of args) {
        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--no-verbose") {
            options.verbose = false;
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    return options;
}

export function buildChangelogArgs({ verbose = true } = {}) {
    return [
        gitCliffCliPath,
        "--config",
        rootCliffConfigPath,
        "--latest",
        "--current",
        "--github-repo",
        githubRepository,
        "--body",
        currentReleaseChangelogBody,
        "--prepend",
        rootChangelogPath,
        ...(verbose ? ["--verbose"] : []),
    ];
}

export function runChangelogWorkflow(options = {}) {
    const cwd = path.resolve(options.cwd ?? repositoryRoot);
    const runCommand = options.runCommand ?? spawnSync;
    const log = options.log ?? console.log;
    const verbose = options.verbose ?? true;

    log("Starting changelog generation...");
    log(`Current directory: ${cwd}`);
    log("Available files:");
    log(formatDirectoryListing(createDirectoryListing(cwd)));
    log("");
    log(`Generating root ${rootChangelogPath}...`);

    const result = runCommand(
        process.execPath,
        buildChangelogArgs({ verbose }),
        { cwd, stdio: "inherit" }
    );

    if (result.error) {
        throw result.error;
    }

    const exitCode = result.status ?? 1;

    if (exitCode !== 0) {
        process.exitCode = exitCode;
        return exitCode;
    }

    log(formatChangelogMetadata(createChangelogMetadata(cwd)));
    log("");
    log("All changelog generation completed.");
    log("Files updated:");
    log(`Found: ${createChangelogMetadata(cwd).path}`);

    return 0;
}

function printUsage() {
    console.log(`Usage: node scripts/generate-changelog-workflow.mjs [options]

Options:
  --no-verbose    Run changelog generation without passing --verbose.
  -h, --help      Show this help text.`);
}
