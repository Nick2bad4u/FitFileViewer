import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
    getAuditEnvironment,
    resolveNpmAuditCommand,
    runAudits,
} from "../../../scripts/run-audit.mjs";
import { npmScriptPrecedenceWarning } from "../../../scripts/lib/audit-report.mjs";
import {
    auditFixture,
    captured,
    leaf,
    type AuditFixture,
} from "../../fixtures/audit-policy/auditFixture";

function makeAuditRun(
    rootFixture = auditFixture(),
    docsFixture = auditFixture("docs")
) {
    const fixtures: Record<string, AuditFixture> = {
        root: rootFixture,
        docs: docsFixture,
    };
    const log = vi.fn();
    const logError = vi.fn();
    const runner = vi.fn(
        (_command: string, _args: string[], options: { cwd: string }) =>
            captured(
                options.cwd.endsWith("docusaurus") ? docsFixture : rootFixture
            )
    );
    const readJson = (file: string): unknown => {
        if (file.includes("audit-policy"))
            return fixtures[path.basename(file, ".json")]?.policy;
        return file.includes("docusaurus")
            ? docsFixture.lock
            : rootFixture.lock;
    };
    const options = {
        runner,
        readJson,
        log,
        logError,
        environment: {
            npm_execpath: "/fixture/npm-cli.js",
            npm_config_allow_scripts: "fixture",
            NPM_CONFIG_ALLOW_SCRIPTS: "fixture",
            HTTPS_PROXY: "https://proxy.invalid",
        },
        root: path.resolve("fixture-root"),
    };
    return { options, runner, log, logError };
}

describe("run-audit orchestration", () => {
    it("captures both workspace audits as JSON with unchanged thresholds and scoped acceptance", () => {
        expect.assertions(8);
        const run = makeAuditRun();
        expect(runAudits(run.options)).toBe(0);
        expect(run.runner).toHaveBeenCalledTimes(2);
        expect(run.runner.mock.calls.map((call) => call[1])).toStrictEqual([
            [
                "/fixture/npm-cli.js",
                "audit",
                "--audit-level=moderate",
                "--json",
            ],
            [
                "/fixture/npm-cli.js",
                "audit",
                "--audit-level=high",
                "--json",
            ],
        ]);
        expect(run.runner.mock.calls[0]?.[2]).toMatchObject({
            encoding: "utf8",
            stdio: [
                "ignore",
                "pipe",
                "pipe",
            ],
            timeout: 300_000,
        });
        expect(run.runner.mock.calls[1]?.[2].cwd).toBe(
            path.resolve("fixture-root", "docusaurus")
        );
        expect(run.log).toHaveBeenCalledWith(
            expect.stringContaining("npm status 1; threshold moderate")
        );
        expect(run.log).toHaveBeenCalledWith(
            expect.stringContaining("GHSA-vfj7-8cjw-p6xm")
        );
        expect(run.logError).not.toHaveBeenCalled();
    });

    it("returns failure for an unknown advisory but still audits the second graph", () => {
        expect.assertions(3);
        const root = auditFixture();
        leaf(root).url = "https://github.com/advisories/GHSA-aaaa-bbbb-cccc";
        const run = makeAuditRun(root);
        expect(runAudits(run.options)).toBe(1);
        expect(run.runner).toHaveBeenCalledTimes(2);
        expect(run.log).toHaveBeenCalledWith(
            expect.stringContaining("Blocking dependency findings:")
        );
    });

    it("preserves failure for infrastructure errors and still captures the other scope", () => {
        expect.assertions(3);
        const run = makeAuditRun();
        run.runner.mockImplementationOnce(() => ({
            stdout: "not-json",
            stderr: "",
            status: 0,
        }));
        expect(runAudits(run.options)).toBe(1);
        expect(run.runner).toHaveBeenCalledTimes(2);
        expect(run.logError).toHaveBeenCalledWith(
            expect.stringContaining("did not return valid JSON")
        );
    });

    it("retains the exact recognized npm precedence diagnostic in the output", () => {
        expect.assertions(2);
        const fixture = auditFixture();
        const run = makeAuditRun(fixture);
        run.runner.mockImplementationOnce(() =>
            captured(fixture, { stderr: `${npmScriptPrecedenceWarning}\n` })
        );
        expect(runAudits(run.options)).toBe(0);
        expect(run.log).toHaveBeenCalledWith(
            `[audit:root] ${npmScriptPrecedenceWarning}`
        );
    });

    it("removes only conflicting script config environment keys", () => {
        expect.assertions(2);
        const environment = {
            npm_config_allow_scripts: "fixture",
            NPM_CONFIG_ALLOW_SCRIPTS: "fixture",
            HTTPS_PROXY: "https://proxy.invalid",
        };
        expect(getAuditEnvironment(environment)).toStrictEqual({
            HTTPS_PROXY: "https://proxy.invalid",
        });
        expect(environment.npm_config_allow_scripts).toBe("fixture");
    });

    it("invokes npm through Node on Windows when npm supplies its native CLI", () => {
        expect.assertions(2);
        const command = resolveNpmAuditCommand(
            ["audit", "--json"],
            { npm_execpath: "C:\\npm\\npm-cli.js" },
            "win32"
        );
        expect(command.command).not.toMatch(/npm\.cmd$/u);
        expect(command.args).toStrictEqual([
            "C:\\npm\\npm-cli.js",
            "audit",
            "--json",
        ]);
    });
});
