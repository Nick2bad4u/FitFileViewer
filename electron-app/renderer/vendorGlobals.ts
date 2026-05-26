import * as arquero from "arquero";
import DOMPurify from "dompurify";
import JSZip from "jszip";
import screenfull from "screenfull";

type RendererVendorGlobal = typeof globalThis & {
    DOMPurify?: typeof DOMPurify;
    JSZip?: typeof JSZip;
    aq?: typeof arquero;
    arquero?: typeof arquero;
    screenfull?: typeof screenfull;
    __FFV_RENDERER_VENDOR_BUNDLE__?: Readonly<{
        loaded: true;
        source: "npm-bundle";
    }>;
};

const vendorGlobal = globalThis as RendererVendorGlobal;

function defineMissingGlobal<Key extends keyof RendererVendorGlobal>(
    key: Key,
    value: NonNullable<RendererVendorGlobal[Key]>
): void {
    if (vendorGlobal[key] === undefined || vendorGlobal[key] === null) {
        Object.defineProperty(vendorGlobal, key, {
            configurable: true,
            value,
            writable: true,
        });
    }
}

defineMissingGlobal("DOMPurify", DOMPurify);
defineMissingGlobal("JSZip", JSZip);
defineMissingGlobal("aq", arquero);
defineMissingGlobal("arquero", arquero);
defineMissingGlobal("screenfull", screenfull);

vendorGlobal.__FFV_RENDERER_VENDOR_BUNDLE__ = {
    loaded: true,
    source: "npm-bundle",
};
