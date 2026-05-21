import { createDataSettingsSignature } from "./renderChartSettingsSignature.js";

/** Callback invoked when the chart data-affecting settings signature changes. */
export type DataSettingsChangedHandler = () => void;

let lastDataSettingsSignature = "";

/** Clears the remembered data settings signature. */
export function clearDataSettingsSignatureCache(): void {
    lastDataSettingsSignature = "";
}

/**
 * Returns the current data settings signature and reports changes after the
 * first observed signature.
 */
export function ensureDataSettingsSignature(
    settings: unknown,
    onChanged: DataSettingsChangedHandler
): string {
    const signature = createDataSettingsSignature(
        settings !== null && typeof settings === "object"
            ? (settings as Record<string, unknown>)
            : undefined
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
