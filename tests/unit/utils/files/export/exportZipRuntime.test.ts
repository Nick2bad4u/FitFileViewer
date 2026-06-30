import { afterEach, describe, expect, it } from "vitest";

import {
    clearExportZipRuntimeForTests,
    isExportZipConstructor,
    registerExportZipRuntime,
    resolveExportZipRuntime,
    type ExportZipConstructor,
} from "../../../../../electron-app/utils/files/export/exportZipRuntime.js";

describe("exportZipRuntime", () => {
    afterEach(() => {
        clearExportZipRuntimeForTests();
    });

    function createZipRuntimeConstructor(): ExportZipConstructor {
        class ZipRuntime {
            async generateAsync(): Promise<Blob> {
                return new Blob();
            }

            file(): this {
                return this;
            }
        }

        return ZipRuntime;
    }

    it("registers a typed ZIP constructor after vendor payload validation", () => {
        expect.assertions(1);

        const ZipRuntime = createZipRuntimeConstructor();

        registerExportZipRuntime(ZipRuntime);

        expect(resolveExportZipRuntime()).toBe(ZipRuntime);
    });

    it("validates ZIP constructors", () => {
        expect.assertions(1);

        const ZipRuntime = createZipRuntimeConstructor();

        expect(isExportZipConstructor(ZipRuntime)).toBe(true);
    });

    it("ignores malformed runtime values", () => {
        expect.assertions(1);

        expect(isExportZipConstructor({ file: () => undefined })).toBe(false);
    });
});
