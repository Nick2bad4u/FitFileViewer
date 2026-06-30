import { afterEach, describe, expect, it } from "vitest";

import {
    clearArqueroRuntimeForTests,
    isArqueroRuntime,
    registerArqueroRuntime,
    resolveArqueroRuntime,
    setArqueroRuntime,
    type ArqueroRuntime,
} from "../../../../../electron-app/utils/rendering/helpers/arqueroRuntime.js";

describe("arqueroRuntime", () => {
    afterEach(() => {
        clearArqueroRuntimeForTests();
    });

    function createArqueroRuntime(): ArqueroRuntime {
        return {
            from: () => ({
                array: () => [],
                columnNames: () => [],
                get: () => undefined,
                numRows: () => 0,
            }),
        };
    }

    it("registers a typed Arquero runtime after vendor payload validation", () => {
        expect.assertions(1);

        const runtime = createArqueroRuntime();

        registerArqueroRuntime(runtime);

        expect(resolveArqueroRuntime()).toBe(runtime);
    });

    it("resolves a registered Arquero-compatible runtime", () => {
        expect.assertions(2);

        const runtime = createArqueroRuntime();

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

    it("ignores runtimes with throwing from accessors", () => {
        expect.assertions(2);

        const runtime = Object.defineProperty({}, "from", {
            get() {
                throw new Error("arquero unavailable");
            },
        });

        setArqueroRuntime(runtime);

        expect(isArqueroRuntime(runtime)).toBe(false);
        expect(resolveArqueroRuntime()).toBeUndefined();
    });
});
