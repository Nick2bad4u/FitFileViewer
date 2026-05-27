import { describe, expect, it } from "vitest";

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
};

async function importCleanReleases(): Promise<CleanReleasesModule> {
    return (await import("../../../scripts/clean-releases.mjs")) as CleanReleasesModule;
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

        expect(
            parseArgs([
                "--keep-last=3",
                "--delete-tags",
                "--releases-json",
                "tmp/releases.json",
            ])
        ).toStrictEqual({
            deleteTags: true,
            help: false,
            keepLast: 3,
            releasesJsonPath: "tmp/releases.json",
            yes: false,
        });
    });

    it("rejects applying deletions against mocked release JSON", async () => {
        expect.assertions(1);

        const { parseArgs } = await importCleanReleases();

        expect(() => {
            parseArgs(["--yes", "--releases-json=tmp/releases.json"]);
        }).toThrow("--yes cannot be combined with --releases-json");
    });

    it("validates release records before planning deletion", async () => {
        expect.assertions(5);

        const { defaultKeepLast, isValidRelease } = await importCleanReleases();

        expect(defaultKeepLast).toBe(5);
        expect(
            isValidRelease({
                publishedAt: "2024-01-01T00:00:00Z",
                tagName: "v1.0.0",
            })
        ).toBe(true);
        expect(isValidRelease({ publishedAt: "bad", tagName: "v1.0.0" })).toBe(
            false
        );
        expect(isValidRelease({ publishedAt: "2024-01-01T00:00:00Z" })).toBe(
            false
        );
        expect(isValidRelease(null)).toBe(false);
    });
});
