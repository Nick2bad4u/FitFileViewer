import { createDataSettingsSignature } from "./renderChartSettingsSignature.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";
let lastDataSettingsSignature = "";
/** Clears the remembered data settings signature. */
export function clearDataSettingsSignatureCache() {
    lastDataSettingsSignature = "";
}
/**
 * Returns the current data settings signature and reports changes after the
 * first observed signature.
 */
export function ensureDataSettingsSignature(settings, onChanged) {
    const signature = createDataSettingsSignature(
        isObjectRecord(settings) ? settings : undefined
    );
    if (
        signature &&
        lastDataSettingsSignature &&
        lastDataSettingsSignature !== signature
    ) {
        onChanged();
    }
    lastDataSettingsSignature = signature;
    return signature;
}
