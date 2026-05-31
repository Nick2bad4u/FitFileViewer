import { describe, expect, it } from "vitest";

import { rootElectronBuilderConfigPath } from "../../../scripts/lib/workspaces.mjs";

type RunElectronBuilderModule = {
    electronBuilderBaseArgs: string[];
    parseArgs: (args: string[]) => {
        builderArgs: string[];
        nodeEnv: string | undefined;
    };
};

async function importRunElectronBuilder(): Promise<RunElectronBuilderModule> {
    return (await import("../../../scripts/run-electron-builder.mjs")) as RunElectronBuilderModule;
}

describe("run-electron-builder script", () => {
    it("builds electron-builder args from root-owned workspace metadata", async () => {
        expect.assertions(3);

        const { electronBuilderBaseArgs, parseArgs } =
            await importRunElectronBuilder();

        expect(electronBuilderBaseArgs).toStrictEqual([
            "--projectDir",
            ".",
            "--config",
            rootElectronBuilderConfigPath,
        ]);
        expect(
            parseArgs([
                "--node-env",
                "production",
                "--dir",
            ])
        ).toStrictEqual({
            builderArgs: ["--dir"],
            nodeEnv: "production",
        });
        expect(() => parseArgs(["--node-env"])).toThrow(
            "--node-env requires a value"
        );
    });
});
