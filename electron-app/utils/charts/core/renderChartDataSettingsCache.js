import { createDataSettingsSignature } from "./renderChartSettingsSignature.js";
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
    const signature = createDataSettingsSignature(settings !== null && typeof settings === "object"
        ? settings
        : undefined);
    if (signature &&
        lastDataSettingsSignature &&
        lastDataSettingsSignature !== signature) {
        onChanged();
    }
    lastDataSettingsSignature = signature;
    return signature;
}
