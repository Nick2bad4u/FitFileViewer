import { getManufacturerName } from "../display/formatAntNames.js";

/**
 * Comprehensive manufacturer name mapping for consistent display formatting
 * @readonly
 */
const MANUFACTURER_MAP = {
    garmin: "Garmin",
    faveroElectronics: "Favero Electronics",
    development: "Development",
    wahoo: "Wahoo",
    polar: "Polar",
    suunto: "Suunto",
    cateye: "CatEye",
    stages: "Stages Cycling",
    sram: "SRAM",
    shimano: "Shimano",
    giant: "Giant",
    trek: "Trek",
    specialized: "Specialized",
    cannondale: "Cannondale",
    tacx: "Tacx",
    elite: "Elite",
    kinetic: "Kinetic",
    cycleops: "CycleOps",
    zwift: "Zwift",
    trainerroad: "TrainerRoad",
    sufferfest: "The Sufferfest",
    computrainer: "CompuTrainer",
    kickr: "Wahoo KICKR",
    neo: "Tacx NEO",
    flux: "Tacx Flux",
    vortex: "Tacx Vortex",
    bushido: "Tacx Bushido",
    genius: "Tacx Genius",
    direto: "Elite Direto",
    suito: "Elite Suito",
    novo: "Elite Novo",
    rampa: "Elite Rampa",
    turbo: "Elite Turbo",
    rock: "Kinetic Rock",
    road: "Kinetic Road",
    inride: "Kinetic inRide",
    fluid2: "CycleOps Fluid2",
    magnus: "CycleOps Magnus",
    hammer: "CycleOps Hammer",
    h3: "CycleOps H3",
    powertap: "PowerTap",
    quarq: "Quarq",
    srm: "SRM",
    pioneer: "Pioneer",
    rotor: "Rotor",
    look: "Look",
    speedplay: "Speedplay",
    time: "Time",
    crankbrothers: "Crankbrothers",
    magene: "Magene",
    igpsport: "iGPSPORT",
    bryton: "Bryton",
    lezyne: "Lezyne",
    sigma: "Sigma Sport",
    bontrager: "Bontrager",
    kask: "Kask",
    giro: "Giro",
    bell: "Bell",
    poc: "POC",
    lazer: "Lazer",
    met: "MET",
    oakley: "Oakley",
    smith: "Smith",
    uvex: "Uvex",
};

/**
 * Configuration for manufacturer formatting
 * @readonly
 */
const MANUFACTURER_CONFIG = {
    ERROR_MESSAGES: {
        FORMATTING_ERROR: "Error formatting manufacturer:",
        ID_LOOKUP_ERROR: "Error looking up manufacturer by ID:",
    },
    FALLBACK_NAME: "Unknown Manufacturer",
};

/**
 * Formats manufacturer names for consistent display across the application
 *
 * Handles both manufacturer IDs (numbers) and name strings. First attempts to resolve
 * numeric IDs using the ANT+ manufacturer database, then applies consistent formatting
 * using the manufacturer mapping table.
 *
 * @param {string|number} manufacturer - Raw manufacturer name or ID
 * @returns {string} Formatted manufacturer name
 * @example
 * // Format by name
 * const name1 = formatManufacturer("garmin"); // "Garmin"
 *
 * // Format by ID (if supported by ANT+ database)
 * const name2 = formatManufacturer(1); // "Garmin" (if ID 1 maps to Garmin)
 *
 * // Unknown manufacturer
 * const name3 = formatManufacturer("unknown"); // "unknown"
 */
export function formatManufacturer(manufacturer) {
    // Input validation
    if (manufacturer === null || manufacturer === undefined) {
        console.warn("[formatManufacturer] Null or undefined manufacturer provided");
        return MANUFACTURER_CONFIG.FALLBACK_NAME;
    }

    try {
        let manufacturerName = manufacturer;

        // If it's a number, try to get the name from the ID mapping first
    if (typeof manufacturer === "number" || (!isNaN(Number(manufacturer)) && manufacturer !== "")) {
            try {
                const nameFromId = getManufacturerName(manufacturer);
                if (nameFromId && nameFromId !== manufacturer.toString()) {
                    // Found a match in ID mapping, use the resolved name
                    manufacturerName = nameFromId;
                }
            } catch (error) {
                console.warn(`[formatManufacturer] ${MANUFACTURER_CONFIG.ERROR_MESSAGES.ID_LOOKUP_ERROR}`, error);
                // Continue with original value if ID lookup fails
            }
        }

        // Convert to string and normalize for lookup
        const normalizedName = String(manufacturerName).toLowerCase().trim();

        // Return formatted name from mapping or original value
    return /** @type {any} */ (MANUFACTURER_MAP)[normalizedName] || String(manufacturer);
    } catch (error) {
        console.error(`[formatManufacturer] ${MANUFACTURER_CONFIG.ERROR_MESSAGES.FORMATTING_ERROR}`, error);
        return String(manufacturer) || MANUFACTURER_CONFIG.FALLBACK_NAME;
    }
}

/**
 * Gets all available manufacturer mappings
 * @returns {Object} Copy of the manufacturer mapping object
 * @example
 * // Get all available manufacturer mappings
 * const allManufacturers = getAllManufacturerMappings();
 */
export function getAllManufacturerMappings() {
    return { ...MANUFACTURER_MAP };
}

/**
 * Checks if a manufacturer has a defined mapping
 * @param {string} manufacturer - The manufacturer name to check
 * @returns {boolean} True if manufacturer has a defined mapping
 * @example
 * // Check if manufacturer has mapping
 * const hasMapping = hasManufacturerMapping("garmin"); // true
 */
export function hasManufacturerMapping(manufacturer) {
    if (typeof manufacturer !== "string") return false;
    return manufacturer.toLowerCase().trim() in MANUFACTURER_MAP;
}
