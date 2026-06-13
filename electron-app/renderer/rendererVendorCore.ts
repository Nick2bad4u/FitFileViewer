import * as arquero from "arquero";
import DOMPurify from "dompurify";
import JSZip from "jszip";
import screenfull from "screenfull";

import { markRendererVendorEntryLoaded } from "./rendererVendorShared.js";

/** Registers renderer vendor runtimes shared across tabs and export flows. */
export function installRendererCoreVendorEntry(): void {
    markRendererVendorEntryLoaded("core", {
        core: {
            arqueroRuntime: arquero,
            domPurifyRuntime: DOMPurify,
            exportZipRuntime: JSZip,
            screenfullRuntime: screenfull,
        },
    });
}

installRendererCoreVendorEntry();
