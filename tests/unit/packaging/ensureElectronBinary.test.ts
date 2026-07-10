import { describe, expect, it, vi } from "vitest";

import { extractZipArchive } from "../../../scripts/ensure-electron-binary.mjs";

describe("ensure Electron binary", () => {
    it("extracts Windows archive paths without passing them through tar", async () => {
        expect.assertions(1);

        const extract = vi.fn(async () => undefined);

        await extractZipArchive(
            String.raw`C:\npm\cache\electron-v42.3.3-win32-x64.zip`,
            String.raw`D:\a\FitFileViewer\node_modules\electron\dist`,
            extract
        );

        expect(extract).toHaveBeenCalledExactlyOnceWith(
            String.raw`C:\npm\cache\electron-v42.3.3-win32-x64.zip`,
            { dir: String.raw`D:\a\FitFileViewer\node_modules\electron\dist` }
        );
    });
});
