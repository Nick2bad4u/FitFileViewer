import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererSummaryLastDataHash,
    getRendererSummaryLastDataHashFromState,
    setRendererSummaryLastDataHash,
    setRendererSummaryLastDataHashInState,
} from "../../../../../electron-app/utils/state/domain/rendererSummaryState.js";

describe("rendererSummaryState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes the summary last-data hash through typed helpers", () => {
        expect.assertions(3);

        expect(getRendererSummaryLastDataHash()).toBe("");

        setRendererSummaryLastDataHash("hash-a", { source: "test" });

        expect(getRendererSummaryLastDataHash()).toBe("hash-a");
        expect(
            stateManager.getState("summary.lastDataHash")
        ).toBe("hash-a");
    });

    it("reads the summary last-data hash through an explicit state reader", () => {
        expect.assertions(3);

        const reads: string[] = [];
        const readState = (path: string): unknown => {
            reads.push(path);
            return "hash-b";
        };

        expect(getRendererSummaryLastDataHashFromState(readState)).toBe(
            "hash-b"
        );
        expect(reads).toStrictEqual(["summary.lastDataHash"]);
        expect(getRendererSummaryLastDataHashFromState(() => 123)).toBe("");
    });

    it("writes the summary last-data hash through an explicit state writer", () => {
        expect.assertions(1);

        const writes: Array<{
            options: unknown;
            path: string;
            value: unknown;
        }> = [];

        setRendererSummaryLastDataHashInState(
            (path, value, options) => {
                writes.push({ options, path, value });
            },
            "hash-c",
            { source: "test" }
        );

        expect(writes).toStrictEqual([
            {
                options: { source: "test" },
                path: "summary.lastDataHash",
                value: "hash-c",
            },
        ]);
    });
});
