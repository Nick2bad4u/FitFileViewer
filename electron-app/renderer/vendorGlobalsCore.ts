import * as arquero from "arquero";
import DOMPurify from "dompurify";
import JSZip from "jszip";
import screenfull from "screenfull";

import {
    defineMissingGlobal,
    markRendererVendorEntryLoaded,
} from "./vendorGlobalsShared.js";

/** Installs renderer globals shared across tabs and export flows. */
export function installRendererCoreVendorGlobals(): void {
    defineMissingGlobal("DOMPurify", DOMPurify);
    defineMissingGlobal("JSZip", JSZip);
    defineMissingGlobal("aq", arquero);
    defineMissingGlobal("arquero", arquero);
    defineMissingGlobal("screenfull", screenfull);
    markRendererVendorEntryLoaded("core");
}

installRendererCoreVendorGlobals();
