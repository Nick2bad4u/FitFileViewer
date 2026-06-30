import { afterEach, describe, expect, it } from "vitest";

import {
    clearExportZipRuntimeForTests,
    isExportZipConstructor,
    registerExportZipRuntime,
    resolveExportZipRuntime,
    setExportZipRuntime,
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

    it("resolves a registered ZIP constructor", () => {
        expect.assertions(2);

        const ZipRuntime = createZipRuntimeConstructor();

        expect(isExportZipConstructor(ZipRuntime)).toBe(true);
        setExportZipRuntime(ZipRuntime);
        expect(resolveExportZipRuntime()).toBe(ZipRuntime);
    });

    it("ignores malformed runtime values", () => {
        expect.assertions(2);

        setExportZipRuntime({ file: () => undefined });

        expect(isExportZipConstructor({ file: () => undefined })).toBe(false);
        expect(resolveExportZipRuntime()).toBeUndefined();
    });
});
