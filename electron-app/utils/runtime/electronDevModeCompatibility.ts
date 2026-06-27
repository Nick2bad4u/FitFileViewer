type ElectronDevModeCompatibilityCandidate = {
    readonly __devMode?: unknown;
};

function isElectronDevModeCompatibilityCandidate(
    value: unknown
): value is ElectronDevModeCompatibilityCandidate {
    return value !== null && typeof value === "object" && "__devMode" in value;
}

export function getElectronDevModeCompatibilityValue(
    value: unknown
): unknown {
    return isElectronDevModeCompatibilityCandidate(value)
        ? value.__devMode
        : undefined;
}

export function getBooleanElectronDevModeCompatibilityFlag(
    value: unknown
): boolean | undefined {
    const flag = getElectronDevModeCompatibilityValue(value);

    return typeof flag === "boolean" ? flag : undefined;
}

export function hasDefinedElectronDevModeCompatibilityMarker(
    value: unknown
): boolean {
    return getElectronDevModeCompatibilityValue(value) !== undefined;
}
