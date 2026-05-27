import { getManufacturerName } from "../display/formatAntNames.js";

const MANUFACTURER_CONFIG = {
    ERROR_MESSAGES: {
        FORMATTING_ERROR: "Error formatting manufacturer:",
        ID_LOOKUP_ERROR: "Error looking up manufacturer by ID:",
    },
    FALLBACK_NAME: "Unknown Manufacturer",
} as const;

const MANUFACTURER_MAP = {
    bell: "Bell",
    bontrager: "Bontrager",
    bryton: "Bryton",
    bushido: "Tacx Bushido",
    cannondale: "Cannondale",
    cateye: "CatEye",
    computrainer: "CompuTrainer",
    crankbrothers: "Crankbrothers",
    cycleops: "CycleOps",
    development: "Development",
    direto: "Elite Direto",
    elite: "Elite",
    faveroelectronics: "Favero Electronics",
    fluid2: "CycleOps Fluid2",
    flux: "Tacx Flux",
    garmin: "Garmin",
    genius: "Tacx Genius",
    giant: "Giant",
    giro: "Giro",
    h3: "CycleOps H3",
    hammer: "CycleOps Hammer",
    igpsport: "iGPSPORT",
    inride: "Kinetic inRide",
    kask: "Kask",
    kickr: "Wahoo KICKR",
    kinetic: "Kinetic",
    lazer: "Lazer",
    lezyne: "Lezyne",
    look: "Look",
    magene: "Magene",
    magnus: "CycleOps Magnus",
    met: "MET",
    neo: "Tacx NEO",
    novo: "Elite Novo",
    oakley: "Oakley",
    pioneer: "Pioneer",
    poc: "POC",
    polar: "Polar",
    powertap: "PowerTap",
    quarq: "Quarq",
    rampa: "Elite Rampa",
    road: "Kinetic Road",
    rock: "Kinetic Rock",
    rotor: "Rotor",
    shimano: "Shimano",
    sigma: "Sigma Sport",
    smith: "Smith",
    specialized: "Specialized",
    speedplay: "Speedplay",
    sram: "SRAM",
    srm: "SRM",
    stages: "Stages Cycling",
    sufferfest: "The Sufferfest",
    suito: "Elite Suito",
    suunto: "Suunto",
    tacx: "Tacx",
    time: "Time",
    trainerroad: "TrainerRoad",
    trek: "Trek",
    turbo: "Elite Turbo",
    uvex: "Uvex",
    vortex: "Tacx Vortex",
    wahoo: "Wahoo",
    zwift: "Zwift",
} as const;

type ManufacturerMapKey = keyof typeof MANUFACTURER_MAP;

/**
 * Formats manufacturer names for consistent display across the application.
 *
 * @param manufacturer - Raw manufacturer name or ID.
 *
 * @returns Formatted manufacturer name.
 */
export function formatManufacturer(manufacturer: unknown): string {
    if (manufacturer === null || manufacturer === undefined) {
        console.warn(
            "[formatManufacturer] Null or undefined manufacturer provided"
        );
        return MANUFACTURER_CONFIG.FALLBACK_NAME;
    }

    try {
        let manufacturerName = manufacturer;

        if (isNumericManufacturer(manufacturer)) {
            try {
                const nameFromId = getManufacturerName(manufacturer);
                if (nameFromId && nameFromId !== String(manufacturer)) {
                    manufacturerName = nameFromId;
                }
            } catch (error) {
                console.warn(
                    `[formatManufacturer] ${MANUFACTURER_CONFIG.ERROR_MESSAGES.ID_LOOKUP_ERROR}`,
                    error
                );
            }
        }

        const normalizedName = String(manufacturerName).toLowerCase().trim();

        return isManufacturerMapKey(normalizedName)
            ? MANUFACTURER_MAP[normalizedName]
            : String(manufacturer);
    } catch (error) {
        console.error(
            `[formatManufacturer] ${MANUFACTURER_CONFIG.ERROR_MESSAGES.FORMATTING_ERROR}`,
            error
        );
        return String(manufacturer) || MANUFACTURER_CONFIG.FALLBACK_NAME;
    }
}

/**
 * Gets all available manufacturer mappings.
 *
 * @returns Copy of the manufacturer mapping object.
 */
export function getAllManufacturerMappings(): Record<string, string> {
    return { ...MANUFACTURER_MAP };
}

/**
 * Checks if a manufacturer has a defined mapping.
 *
 * @param manufacturer - The manufacturer name to check.
 *
 * @returns True if manufacturer has a defined mapping.
 */
export function hasManufacturerMapping(manufacturer: unknown): boolean {
    if (typeof manufacturer !== "string") {
        return false;
    }
    return isManufacturerMapKey(manufacturer.toLowerCase().trim());
}

function isManufacturerMapKey(value: string): value is ManufacturerMapKey {
    return Object.hasOwn(MANUFACTURER_MAP, value);
}

function isNumericManufacturer(value: unknown): value is number | string {
    return (
        typeof value === "number" ||
        (typeof value === "string" &&
            value !== "" &&
            !Number.isNaN(Number(value)))
    );
}
