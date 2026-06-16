import Leaflet from "leaflet";
import LeafletMiniMap from "leaflet-minimap";
/* eslint-disable import-x/no-unassigned-import -- Leaflet stylesheets must be loaded through the bundle entry. */
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// CSS comes from the npm package, but the measurement control implementation is
// local because upstream leaflet-measure JS uses unsafe-eval and violates the app CSP.
import "leaflet-measure/dist/leaflet-measure.css";
import "leaflet-minimap/dist/Control.MiniMap.min.css";
/* eslint-enable import-x/no-unassigned-import */
import minimapToggleIconUrl from "leaflet-minimap/dist/images/toggle.svg";
import { FullScreen } from "leaflet.fullscreen";
/* eslint-disable import-x/no-unassigned-import -- Leaflet control stylesheets must be loaded through the bundle entry. */
import "leaflet.fullscreen/dist/Control.FullScreen.css";
/* eslint-enable import-x/no-unassigned-import */
import { LocateControl } from "leaflet.locatecontrol";
/* eslint-disable import-x/no-unassigned-import -- Leaflet control stylesheets must be loaded through the bundle entry. */
import "leaflet.locatecontrol/dist/L.Control.Locate.css";
/* eslint-enable import-x/no-unassigned-import */
/* eslint-disable import-x/no-unassigned-import -- MapLibre stylesheet must be loaded through the bundle entry. */
import "maplibre-gl/dist/maplibre-gl.css";
/* eslint-enable import-x/no-unassigned-import */

import { installLeafletMeasureLite } from "./leafletMeasureLite.js";
import { getRendererVendorMapRuntime } from "./rendererVendorMapRuntime.js";
import { markRendererVendorEntryLoaded } from "./rendererVendorShared.js";
import { setLeafletRuntime } from "../utils/maps/core/leafletRuntime.js";

const leafletGlobal = Leaflet as typeof Leaflet & {
    Control: typeof Leaflet.Control & {
        FullScreen?: typeof FullScreen;
        Locate?: typeof LocateControl;
        MiniMap?: new (...args: unknown[]) => unknown;
    };
    control: typeof Leaflet.control & {
        fullscreen?: (
            options?: ConstructorParameters<typeof FullScreen>[0]
        ) => InstanceType<typeof FullScreen>;
        locate?: (
            options?: ConstructorParameters<typeof LocateControl>[0]
        ) => InstanceType<typeof LocateControl>;
        minimap?: (layer: unknown, options?: unknown) => unknown;
    };
};
const rendererVendorMapRuntime = getRendererVendorMapRuntime();

function installMinimapToggleIcon(): void {
    if (!rendererVendorMapRuntime.hasDocumentElement()) {
        return;
    }

    const minimapToggleIconUrlValue: unknown = minimapToggleIconUrl;
    const minimapToggleIconUrlString =
        typeof minimapToggleIconUrlValue === "string"
            ? minimapToggleIconUrlValue
            : "";
    const escapedMinimapToggleIconUrl = minimapToggleIconUrlString.replaceAll(
        /["\\]/gu,
        String.raw`\$&`
    );

    rendererVendorMapRuntime.setDocumentElementStyleProperty(
        "--ffv-minimap-toggle-icon",
        `url("${escapedMinimapToggleIconUrl}")`
    );
}

function removeLeafletCompatibilityGlobals(): void {
    rendererVendorMapRuntime.deleteCompatibilityGlobal("L");
    rendererVendorMapRuntime.deleteCompatibilityGlobal("Leaflet");
}

/** Installs the Leaflet runtime and map plugins used by the Map tab. */
export async function installRendererMapVendorEntry(): Promise<void> {
    installMinimapToggleIcon();

    leafletGlobal.Control.FullScreen = FullScreen;
    leafletGlobal.Control.Locate = LocateControl;
    leafletGlobal.Control.MiniMap = LeafletMiniMap;
    leafletGlobal.control.fullscreen = (options) => new FullScreen(options);
    leafletGlobal.control.locate = (options) => new LocateControl(options);
    leafletGlobal.control.minimap = (layer, options) =>
        new LeafletMiniMap(layer, options);

    setLeafletRuntime(Leaflet);

    // eslint-disable-next-line import-x/no-unresolved -- Vite provides this virtual module in vite.renderer.config.mjs.
    await import("fitfileviewer:leaflet-draw-runtime");
    await import("@maplibre/maplibre-gl-leaflet");
    installLeafletMeasureLite(Leaflet);
    removeLeafletCompatibilityGlobals();

    markRendererVendorEntryLoaded("map", {
        map: { leafletRuntime: Leaflet },
    });
}

await installRendererMapVendorEntry();
