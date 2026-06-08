import { afterEach, describe, expect, it } from "vitest";

import {
    clearExportZipRuntimeForTests,
    isExportZipConstructor,
    resolveExportZipRuntime,
    setExportZipRuntime,
} from "../../../../../electron-app/utils/files/export/exportZipRuntime.js";

describe("exportZipRuntime", () => {
    afterEach(() => {
        clearExportZipRuntimeForTests();
    });

    it("resolves a registered ZIP constructor", () => {
        expect.assertions(2);

        class ZipRuntime {
            async generateAsync(): Promise<Blob> {
                return new Blob();
            }

            file(): this {
                return this;
            }
        }

        setExportZipRuntime(ZipRuntime);

        expect(isExportZipConstructor(ZipRuntime)).toBe(true);
        expect(resolveExportZipRuntime()).toBe(ZipRuntime);
    });

    it("ignores malformed runtime values", () => {
        expect.assertions(2);

        setExportZipRuntime({ file: () => undefined });

        expect(isExportZipConstructor({ file: () => undefined })).toBe(false);
        expect(resolveExportZipRuntime()).toBeUndefined();
    });
});
