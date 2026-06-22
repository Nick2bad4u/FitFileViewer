import {
    getPowerEstimationSettings,
    type PowerEstimationSettings,
    setPowerEstimationSettings,
} from "../../data/processing/powerEstimationSettings.js";
import { showNotification } from "../notifications/showNotification.js";
import { createModalFocusTrap } from "./modalFocusTrap.js";
import { getOpenPowerEstimationSettingsModalRuntime } from "./openPowerEstimationSettingsModalRuntime.js";

type NumberInputBounds = {
    max: number;
    min: number;
    name: string;
    step: number;
};

type NumberValidationOptions = {
    allowNegative?: boolean;
    max?: number;
    min?: number;
};

type OpenPowerEstimationSettingsModalParams = {
    hasRealPower: boolean;
    onApply: (settings: PowerEstimationSettings) => void;
};

const openPowerEstimationSettingsModalRuntime =
    getOpenPowerEstimationSettingsModalRuntime();

/**
 * Open the Power Estimation settings modal.
 *
 * @param params - Current power availability and apply callback.
 */
export function openPowerEstimationSettingsModal({
    hasRealPower,
    onApply,
}: OpenPowerEstimationSettingsModalParams): void {
    const current = getPowerEstimationSettings();

    const overlay =
        openPowerEstimationSettingsModalRuntime.createElement("div");
    overlay.className = "power-estimation-settings-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10050;
        backdrop-filter: blur(4px);
    `;
    const eventListeners =
        openPowerEstimationSettingsModalRuntime.createAbortController();
    let focusTrapCleanup: (() => void) | undefined;

    function cleanup(): void {
        eventListeners.abort();
        focusTrapCleanup?.();
        focusTrapCleanup = undefined;
        if (openPowerEstimationSettingsModalRuntime.bodyContains(overlay)) {
            overlay.remove();
        }
    }

    function handleEscape(e: KeyboardEvent): void {
        if (e.key === "Escape") {
            cleanup();
        }
    }

    openPowerEstimationSettingsModalRuntime.addDocumentKeydownListener(
        handleEscape,
        {
            signal: eventListeners.signal,
        }
    );

    const modal = openPowerEstimationSettingsModalRuntime.createElement("div");
    modal.className = "power-estimation-settings-modal";
    modal.setAttribute("aria-describedby", "power-estimation-settings-note");
    modal.setAttribute("aria-labelledby", "power-estimation-settings-title");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("role", "dialog");
    modal.style.cssText = `
        background: var(--color-glass);
        border: 1px solid var(--color-glass-border);
        border-radius: 14px;
        padding: 18px;
        width: min(560px, 92vw);
        max-height: 82vh;
        overflow: auto;
        color: var(--color-fg);
    `;

    const title = openPowerEstimationSettingsModalRuntime.createElement("div");
    title.id = "power-estimation-settings-title";
    title.textContent = "⚡ Estimated Power (Experimental)";
    title.style.cssText =
        "font-size: 1.1rem; font-weight: 800; margin-bottom: 8px;";

    const note = openPowerEstimationSettingsModalRuntime.createElement("div");
    note.id = "power-estimation-settings-note";
    note.style.cssText =
        "color: var(--color-fg-muted); font-size: 0.9rem; margin-bottom: 12px; line-height: 1.4;";
    note.textContent = hasRealPower
        ? "This file contains real power data. Estimated power will not be applied."
        : "This estimates power from speed + elevation/grade using a physics-based model (virtual power). Results are approximate.";

    const form = openPowerEstimationSettingsModalRuntime.createElement("div");
    form.style.cssText =
        "display: grid; grid-template-columns: 1fr 1fr; gap: 10px;";

    const makeField = (
        labelText: string,
        inputEl: HTMLElement
    ): HTMLLabelElement => {
        const wrap =
            openPowerEstimationSettingsModalRuntime.createElement("label");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        const label =
            openPowerEstimationSettingsModalRuntime.createElement("span");
        label.textContent = labelText;
        label.style.cssText =
            "font-size: 0.85rem; color: var(--color-fg-muted);";
        wrap.append(label, inputEl);
        return wrap;
    };

    const makeNumber = (
        value: number,
        { max, min, name, step }: NumberInputBounds
    ): HTMLInputElement => {
        const input =
            openPowerEstimationSettingsModalRuntime.createElement("input");
        input.type = "number";
        input.name = name;
        input.value = String(value);
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.style.cssText = `
            padding: 8px 10px;
            border-radius: 10px;
            border: 1px solid var(--color-glass-border);
            background: rgba(0,0,0,0.12);
            color: var(--color-fg);
        `;
        return input;
    };

    const enabledInput =
        openPowerEstimationSettingsModalRuntime.createElement("input");
    enabledInput.type = "checkbox";
    enabledInput.name = "enabled";
    enabledInput.checked = current.enabled;

    const enabledWrap =
        openPowerEstimationSettingsModalRuntime.createElement("label");
    enabledWrap.style.cssText =
        "grid-column: 1 / -1; display:flex; align-items:center; gap:10px; margin-bottom: 4px;";
    const enabledText =
        openPowerEstimationSettingsModalRuntime.createElement("span");
    enabledText.textContent = "Enable estimated power for files without power";
    enabledWrap.append(enabledInput, enabledText);

    const riderWeight = makeNumber(current.riderWeightKg, {
        name: "riderWeightKg",
        min: 30,
        max: 200,
        step: 0.5,
    });
    const bikeWeight = makeNumber(current.bikeWeightKg, {
        name: "bikeWeightKg",
        min: 1,
        max: 40,
        step: 0.5,
    });
    const crr = makeNumber(current.crr, {
        name: "crr",
        min: 0.001,
        max: 0.03,
        step: 0.0005,
    });
    const cda = makeNumber(current.cda, {
        name: "cda",
        min: 0.15,
        max: 0.8,
        step: 0.01,
    });
    const eta = makeNumber(current.drivetrainEfficiency, {
        name: "drivetrainEfficiency",
        min: 0.85,
        max: 1,
        step: 0.01,
    });
    const wind = makeNumber(current.windSpeedMps, {
        name: "windSpeedMps",
        min: -20,
        max: 20,
        step: 0.5,
    });
    const gradeWindow = makeNumber(current.gradeWindowMeters, {
        name: "gradeWindowMeters",
        min: 5,
        max: 200,
        step: 1,
    });
    const maxPower = makeNumber(current.maxPowerW, {
        name: "maxPowerW",
        min: 500,
        max: 4000,
        step: 50,
    });

    form.append(
        makeField("Rider weight (kg)", riderWeight),
        makeField("Bike + gear weight (kg)", bikeWeight),
        makeField("Rolling resistance Crr", crr),
        makeField("Aerodynamic CdA (m²)", cda),
        makeField("Drivetrain efficiency", eta),
        makeField("Wind (m/s, +headwind)", wind),
        makeField("Grade smoothing window (m)", gradeWindow),
        makeField("Max power clamp (W)", maxPower)
    );

    const actions =
        openPowerEstimationSettingsModalRuntime.createElement("div");
    actions.style.cssText =
        "display:flex; justify-content:flex-end; gap:10px; margin-top: 14px;";

    const cancel =
        openPowerEstimationSettingsModalRuntime.createElement("button");
    cancel.className = "themed-btn";
    cancel.textContent = "Cancel";
    cancel.type = "button";

    const apply =
        openPowerEstimationSettingsModalRuntime.createElement("button");
    apply.className = "themed-btn";
    apply.textContent = "Apply";
    apply.type = "button";

    cancel.addEventListener("click", cleanup, {
        signal: eventListeners.signal,
    });
    apply.addEventListener(
        "click",
        () => {
            const parsed: PowerEstimationSettings = {
                enabled: enabledInput.checked,
                bikeWeightKg: Number(bikeWeight.value),
                cda: Number(cda.value),
                crr: Number(crr.value),
                drivetrainEfficiency: Number(eta.value),
                gradeWindowMeters: Number(gradeWindow.value),
                maxPowerW: Number(maxPower.value),
                riderWeightKg: Number(riderWeight.value),
                windSpeedMps: Number(wind.value),
            };

            function validateNumber(
                label: string,
                value: number,
                opts: NumberValidationOptions = {}
            ): boolean {
                if (!Number.isFinite(value)) {
                    void showNotification(
                        `${label} must be a valid number.`,
                        "error"
                    );
                    return false;
                }
                if (!opts?.allowNegative && value < 0) {
                    void showNotification(
                        `${label} must be a positive number.`,
                        "error"
                    );
                    return false;
                }
                if (typeof opts?.min === "number" && value < opts.min) {
                    void showNotification(
                        `${label} must be at least ${opts.min}.`,
                        "error"
                    );
                    return false;
                }
                if (typeof opts?.max === "number" && value > opts.max) {
                    void showNotification(
                        `${label} must be at most ${opts.max}.`,
                        "error"
                    );
                    return false;
                }
                return true;
            }

            if (
                !validateNumber("Rider weight", parsed.riderWeightKg, {
                    min: 30,
                    max: 200,
                })
            )
                return;
            if (
                !validateNumber("Bike + gear weight", parsed.bikeWeightKg, {
                    min: 1,
                    max: 40,
                })
            )
                return;
            // Keep the label text containing "Rolling Resistance" to satisfy tests and user clarity.
            if (
                !validateNumber("Rolling Resistance", parsed.crr, {
                    min: 0.001,
                    max: 0.03,
                })
            )
                return;
            if (
                !validateNumber("Aerodynamic CdA", parsed.cda, {
                    min: 0.15,
                    max: 0.8,
                })
            )
                return;
            if (
                !validateNumber(
                    "Drivetrain efficiency",
                    parsed.drivetrainEfficiency,
                    { min: 0.85, max: 1 }
                )
            )
                return;
            if (
                !validateNumber("Wind", parsed.windSpeedMps, {
                    allowNegative: true,
                    min: -20,
                    max: 20,
                })
            )
                return;
            if (
                !validateNumber(
                    "Grade smoothing window",
                    parsed.gradeWindowMeters,
                    { min: 5, max: 200 }
                )
            )
                return;
            if (
                !validateNumber("Max power clamp", parsed.maxPowerW, {
                    min: 500,
                    max: 4000,
                })
            )
                return;

            setPowerEstimationSettings(parsed);
            try {
                onApply(parsed);
            } catch (error) {
                console.error(
                    "Failed to apply power estimation settings",
                    error
                );
            }
            cleanup();
        },
        { signal: eventListeners.signal }
    );

    actions.append(cancel, apply);

    modal.append(title, note, enabledWrap, form, actions);
    overlay.append(modal);
    overlay.addEventListener(
        "mousedown",
        (e) => {
            if (e.target === overlay) {
                cleanup();
            }
        },
        { signal: eventListeners.signal }
    );

    openPowerEstimationSettingsModalRuntime.appendToBody(overlay);
    focusTrapCleanup = createModalFocusTrap(modal, cancel);
}
