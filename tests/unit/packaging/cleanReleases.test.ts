import path from "node:path";

import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../../scripts/lib/workspaces.mjs";

type CleanRelease = {
    publishedAt: string;
    publishedAtTime: number;
    tagName: string;
};

type CleanReleasesModule = {
    createCleanupPlan: (
        releases: unknown[],
        keepLast: number
    ) => {
        keepTags: string[];
        releasesToDelete: CleanRelease[];
        sortedReleases: CleanRelease[];
    };
    defaultKeepLast: number;
    isValidRelease: (release: unknown) => boolean;
    parseArgs: (args: string[]) => {
        deleteTags: boolean;
        help: boolean;
        keepLast: number;
        releasesJsonPath: string | undefined;
        yes: boolean;
    };
    resolveReleasesJsonPath: (releasesJsonPath: string) => string;
};

async function importCleanReleases(): Promise<CleanReleasesModule> {
    return (await import("../../../scripts/clean-releases.mjs")) as CleanReleasesModule;
}

function getReleaseValidity(
    isValidRelease: (release: unknown) => boolean
): Record<string, boolean> {
    return {
        invalidDate: isValidRelease({
            publishedAt: "bad",
            tagName: "v1.0.0",
        }),
        missingPublishedAt: isValidRelease({ tagName: "v1.0.0" }),
        missingTagName: isValidRelease({
            publishedAt: "2024-01-01T00:00:00Z",
        }),
        nullRelease: isValidRelease(null),
        validRelease: isValidRelease({
            publishedAt: "2024-01-01T00:00:00Z",
            tagName: "v1.0.0",
        }),
    };
}

describe("clean-releases script", () => {
    it("keeps first major releases and the requested newest releases", async () => {
        expect.assertions(3);

        const { createCleanupPlan } = await importCleanReleases();
        const plan = createCleanupPlan(
            [
                { tagName: "v2.2.0", publishedAt: "2024-05-01T00:00:00Z" },
                { tagName: "v1.0.0", publishedAt: "2024-01-01T00:00:00Z" },
                { tagName: "missing-date" },
                { tagName: "v2.0.0", publishedAt: "2024-03-01T00:00:00Z" },
                { tagName: "v1.1.0", publishedAt: "2024-02-01T00:00:00Z" },
                { tagName: "v3.0.0", publishedAt: "2024-06-01T00:00:00Z" },
                { tagName: "v2.1.0", publishedAt: "2024-04-01T00:00:00Z" },
            ],
            2
        );

        expect(
            plan.sortedReleases.map((release) => release.tagName)
        ).toStrictEqual([
            "v1.0.0",
            "v1.1.0",
            "v2.0.0",
            "v2.1.0",
            "v2.2.0",
            "v3.0.0",
        ]);
        expect(plan.keepTags).toStrictEqual([
            "v1.0.0",
            "v2.0.0",
            "v2.2.0",
            "v3.0.0",
        ]);
        expect(
            plan.releasesToDelete.map((release) => release.tagName)
        ).toStrictEqual(["v1.1.0", "v2.1.0"]);
    });

    it("parses dry-run release cleanup arguments", async () => {
        expect.assertions(1);

        const { parseArgs } = await importCleanReleases();
        const parseCases = [
            {
                args: [
                    "--keep-last=3",
                    "--delete-tags",
                    "--releases-json",
                    "tmp/releases.json",
                ],
                label: "explicit keep count and tag deletion",
            },
            {
                args: ["--releases-json=tmp/releases.json"],
                label: "release JSON dry run with default keep count",
            },
        ];

        expect(
            parseCases.map(({ args, label }) => ({
                label,
                parsed: parseArgs(args),
            }))
        ).toStrictEqual([
            {
                label: "explicit keep count and tag deletion",
                parsed: {
                    deleteTags: true,
                    help: false,
                    keepLast: 3,
                    releasesJsonPath: "tmp/releases.json",
                    yes: false,
                },
            },
            {
                label: "release JSON dry run with default keep count",
                parsed: {
                    deleteTags: false,
                    help: false,
                    keepLast: 5,
                    releasesJsonPath: "tmp/releases.json",
                    yes: false,
                },
            },
        ]);
    });

    it("rejects applying deletions against mocked release JSON", async () => {
        expect.assertions(1);

        const { parseArgs } = await importCleanReleases();

        expect(() => {
            parseArgs(["--yes", "--releases-json=tmp/releases.json"]);
        }).toThrow("--yes cannot be combined with --releases-json");
    });

    it("validates release records before planning deletion", async () => {
        expect.assertions(1);

        const { defaultKeepLast, isValidRelease } = await importCleanReleases();

        expect({
            defaultKeepLast,
            releaseValidity: getReleaseValidity(isValidRelease),
        }).toStrictEqual({
            defaultKeepLast: 5,
            releaseValidity: {
                invalidDate: false,
                missingPublishedAt: false,
                missingTagName: false,
                nullRelease: false,
                validRelease: true,
            },
        });
    });

    it("rejects release JSON arguments without path values", async () => {
        expect.assertions(2);

        const { parseArgs } = await importCleanReleases();

        expect(() => parseArgs(["--releases-json"])).toThrow(
            "--releases-json requires a value"
        );
        expect(() => parseArgs(["--releases-json", "--delete-tags"])).toThrow(
            "--releases-json requires a value"
        );
    });

    it("resolves release JSON dry-run fixtures from the repository root", async () => {
        expect.assertions(1);

        const { resolveReleasesJsonPath } = await importCleanReleases();

        expect(resolveReleasesJsonPath("tmp/releases.json")).toBe(
            path.join(repositoryRoot, "tmp", "releases.json")
        );
    });

    it("rejects release JSON dry-run fixtures outside the repository", async () => {
        expect.assertions(2);

        const { resolveReleasesJsonPath } = await importCleanReleases();
        const outsideRelativePath = path.join("..", "releases.json");
        const outsideAbsolutePath = path.join(
            repositoryRoot,
            "..",
            "releases.json"
        );

        expect(() => resolveReleasesJsonPath(outsideRelativePath)).toThrow(
            `Refusing to read release JSON outside repository: ${outsideRelativePath}`
        );
        expect(() => resolveReleasesJsonPath(outsideAbsolutePath)).toThrow(
            `Refusing to read release JSON outside repository: ${outsideAbsolutePath}`
        );
    });
});
