import * as arquero from "arquero";
import DOMPurify from "dompurify";
import JSZip from "jszip";
import screenfull from "screenfull";

import { markRendererVendorEntryLoaded } from "./vendorGlobalsShared.js";
import { setExportZipRuntime } from "../utils/files/export/exportZipRuntime.js";
import { setDomPurifyRuntime } from "../utils/dom/domPurifyRuntime.js";
import { setArqueroRuntime } from "../utils/rendering/helpers/arqueroRuntime.js";
import { setScreenfullRuntime } from "../utils/ui/controls/screenfullRuntime.js";

/** Registers renderer vendor runtimes shared across tabs and export flows. */
export function installRendererCoreVendorGlobals(): void {
    setArqueroRuntime(arquero);
    setExportZipRuntime(JSZip);
    setDomPurifyRuntime(DOMPurify);
    setScreenfullRuntime(screenfull);
    markRendererVendorEntryLoaded("core");
}

installRendererCoreVendorGlobals();
