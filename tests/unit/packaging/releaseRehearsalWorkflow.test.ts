import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

const releaseRehearsalWorkflowPath = path.join(
    process.cwd(),
    ".github",
    "workflows",
    "release-rehearsal.yml"
);

function readReleaseRehearsalWorkflow(): string {
    return readFileSync(releaseRehearsalWorkflowPath, "utf8");
}

describe("release rehearsal workflow", () => {
    it("adds optional macOS compatibility without bypassing the release gates", () => {
        expect.assertions(6);
        const { jobs } = parseYaml(readReleaseRehearsalWorkflow()) as {
            jobs: Record<string, Record<string, unknown>>;
        };
        const compatibility = jobs["macos-compatibility"];
        expect(compatibility?.if).toBe(
            "inputs.compatibility-rehearsal-run-id != ''"
        );
        expect(compatibility?.uses).toBe(
            "./.github/workflows/macos-compatibility-smoke.yml"
        );
        expect(compatibility?.with).toEqual({
            "rehearsal-run-id": "${{ inputs.compatibility-rehearsal-run-id }}",
        });
        expect(compatibility?.permissions).toEqual({
            actions: "read",
            contents: "read",
        });
        expect(jobs["release-verification"]).not.toHaveProperty("if");
        expect(jobs["release-rehearsal"]).not.toHaveProperty("if");
    });

    it("requires the complete gate independently of all six native artifact jobs", () => {
        expect.assertions(9);
        type RehearsalJob = {
            "runs-on": string;
            "timeout-minutes": number;
            steps: { run?: string }[];
            strategy?: { matrix: { include: unknown[] } };
        };
        const { jobs } = parseYaml(readReleaseRehearsalWorkflow()) as {
            jobs: Record<
                "release-verification" | "release-rehearsal",
                RehearsalJob
            >;
        };
        const gate = jobs["release-verification"];
        const artifacts = jobs["release-rehearsal"];
        const gateCommands = gate.steps
            .map((step) => step.run ?? "")
            .join("\n");
        expect(gate["runs-on"]).toBe("ubuntu-latest");
        expect(gate["timeout-minutes"]).toBe(60);
        expect(gate).not.toHaveProperty("continue-on-error");
        expect(gate).not.toHaveProperty("if");
        expect(artifacts).not.toHaveProperty("needs");
        expect(gateCommands).toContain("xvfb-run -a npm run release:verify &");
        expect(gateCommands).toContain('wait "$verify_pid"');
        expect(
            artifacts.steps.map((step) => step.run ?? "").join("\n")
        ).not.toMatch(/npm run release:verify(?:\s|$)/u);
        expect(artifacts.strategy?.matrix.include).toHaveLength(6);
    });

    it("runs the release gate, signing preflight, packaged smoke, and artifact upload without publishing", () => {
        expect.assertions(46);

        const workflow = readReleaseRehearsalWorkflow();

        expect(workflow).toContain("workflow_dispatch:");
        expect(workflow).toContain("require-code-signing:");
        expect(workflow).toContain("smoke-timeout-ms:");
        expect(workflow).toContain("fail-fast:");
        expect(workflow).toContain(
            "Cancel remaining platform rehearsals after the first failure"
        );
        expect(workflow).toContain(
            "fail-fast: ${{ inputs.fail-fast == 'true' }}"
        );
        expect(workflow).toContain("os: ubuntu-latest");
        expect(workflow).toContain("os: windows-latest");
        expect(workflow).toContain("os: macos-latest");
        expect(workflow).toContain("runner-os: Linux");
        expect(workflow).toContain("runner-os: Windows");
        expect(workflow).toContain("runner-os: macOS");
        expect(workflow).toContain("node-version-file: .node-version");
        expect(workflow).toContain("npm install --global npm@12.0.2");
        expect(workflow).toContain(
            'echo "Release verification is still running..."'
        );
        expect(workflow).toContain("if: runner.os == 'Linux'");
        expect(workflow).toContain("npm run release:check-signing");
        expect(workflow).toContain('--runner-os "${{ matrix.runner-os }}"');
        expect(workflow).toContain(
            "APPLE_API_ISSUER: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_API_ISSUER || '' }}"
        );
        expect(workflow).toContain(
            "APPLE_API_KEY_BASE64: ${{ secrets.APPLE_API_KEY_BASE64 }}"
        );
        expect(workflow).toContain(
            'echo "APPLE_API_KEY=$APPLE_API_KEY_PATH" >> "$GITHUB_ENV"'
        );
        expect(workflow).toContain(
            "APPLE_API_KEY_ID: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_API_KEY_ID || '' }}"
        );
        expect(workflow).toContain(
            "APPLE_APP_SPECIFIC_PASSWORD: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_APP_SPECIFIC_PASSWORD || '' }}"
        );
        expect(workflow).toContain(
            "APPLE_ID: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_ID || '' }}"
        );
        expect(workflow).toContain(
            "APPLE_KEYCHAIN_PROFILE: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_KEYCHAIN_PROFILE || '' }}"
        );
        expect(workflow).toContain(
            "APPLE_TEAM_ID: ${{ matrix.runner-os == 'macOS' && secrets.APPLE_TEAM_ID || '' }}"
        );
        expect(workflow).toContain(
            "CSC_INSTALLER_KEY_PASSWORD: ${{ matrix.runner-os == 'macOS' && secrets.MACOS_CSC_INSTALLER_KEY_PASSWORD || '' }}"
        );
        expect(workflow).toContain(
            "CSC_INSTALLER_LINK: ${{ matrix.runner-os == 'macOS' && secrets.MACOS_CSC_INSTALLER_LINK || '' }}"
        );
        expect(workflow).toContain(
            "CSC_KEY_PASSWORD: ${{ matrix.runner-os == 'macOS' && secrets.MACOS_CSC_KEY_PASSWORD || matrix.runner-os == 'Windows' && secrets.WINDOWS_CSC_KEY_PASSWORD || '' }}"
        );
        expect(workflow).toContain(
            "CSC_LINK: ${{ matrix.runner-os == 'macOS' && secrets.MACOS_CSC_LINK || '' }}"
        );
        expect(workflow).toContain(
            "WIN_CSC_LINK: ${{ matrix.runner-os == 'Windows' && secrets.WINDOWS_CSC_LINK || '' }}"
        );
        expect(workflow).toContain("xvfb-run -a npm run release:verify");
        expect(workflow).toContain("npm run build:ci-matrix");
        expect(workflow).toContain("node scripts/run-distributable-smoke.mjs");
        expect(workflow).toContain("arch: universal");
        expect(workflow).toContain("arch: ia32");
        expect(workflow).toContain("FFV_PACKAGED_SMOKE_TIMEOUT_MS:");
        expect(workflow).toContain('FFV_FORCE_UNSIGNED_PACKAGE: "true"');
        expect(workflow).toContain('CSC_IDENTITY_AUTO_DISCOVERY: "false"');
        expect(workflow).toContain("npm run release:list-release-dist-files");
        expect(workflow).toContain('REQUIRE_CODE_SIGNING: "false"');
        expect(workflow).toContain("actions/upload-artifact@");
        expect(workflow).toContain(
            "name: release-rehearsal-${{ matrix.os }}-${{ matrix.arch }}"
        );
        expect(workflow).toContain("release-dist/distributable-smoke-*.json");
        expect(workflow).not.toContain("softprops/action-gh-release");
        expect(workflow).not.toContain("npm run package:signed");
    });
});
