import { describe, expect, it } from "vitest";

type CliOptionsModule = {
    readInlineOptionValue: (arg: string, optionName: string) => string;
    readOptionValue: (
        args: string[],
        index: number,
        optionName: string
    ) => string;
    requireOption: (value: string | undefined, optionName: string) => void;
};

async function importCliOptions(): Promise<CliOptionsModule> {
    return (await import("../../../scripts/lib/cli-options.mjs")) as CliOptionsModule;
}

describe("cli option helpers", () => {
    it("reads separated and inline option values", async () => {
        expect.assertions(2);

        const { readInlineOptionValue, readOptionValue } =
            await importCliOptions();

        expect(readOptionValue(["--status", "success"], 0, "--status")).toBe(
            "success"
        );
        expect(readInlineOptionValue("--status=failure", "--status")).toBe(
            "failure"
        );
    });

    it("rejects missing option values", async () => {
        expect.assertions(3);

        const { readInlineOptionValue, readOptionValue } =
            await importCliOptions();

        expect(() => readOptionValue(["--status"], 0, "--status")).toThrow(
            "--status requires a value"
        );
        expect(() =>
            readOptionValue(["--status", "--next"], 0, "--status")
        ).toThrow("--status requires a value");
        expect(() => readInlineOptionValue("--status=", "--status")).toThrow(
            "--status requires a value"
        );
    });

    it("rejects missing required options", async () => {
        expect.assertions(2);

        const { requireOption } = await importCliOptions();

        expect(() => requireOption(undefined, "--status")).toThrow(
            "--status is required"
        );
        expect(() => requireOption("", "--status")).toThrow(
            "--status is required"
        );
    });
});
