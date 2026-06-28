import { afterEach, describe, expect, it } from "vitest";

import {
    clearArqueroRuntimeForTests,
    isArqueroRuntime,
    resolveArqueroRuntime,
    setArqueroRuntime,
} from "../../../../../electron-app/utils/rendering/helpers/arqueroRuntime.js";

describe("arqueroRuntime", () => {
    afterEach(() => {
        clearArqueroRuntimeForTests();
    });

    it("resolves a registered Arquero-compatible runtime", () => {
        expect.assertions(2);

        const runtime = {
            from: () => ({
                array: () => [],
                columnNames: () => [],
                get: () => undefined,
                numRows: () => 0,
            }),
        };

        setArqueroRuntime(runtime);

        expect(isArqueroRuntime(runtime)).toBe(true);
        expect(resolveArqueroRuntime()).toBe(runtime);
    });

    it("ignores malformed runtimes", () => {
        expect.assertions(3);

        setArqueroRuntime({ table: () => undefined });

        expect(isArqueroRuntime({ table: () => undefined })).toBe(false);
        expect(isArqueroRuntime([() => undefined])).toBe(false);
        expect(resolveArqueroRuntime()).toBeUndefined();
    });
});
