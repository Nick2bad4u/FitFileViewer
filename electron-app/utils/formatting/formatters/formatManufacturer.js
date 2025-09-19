import { getManufacturerName } from "../display/formatAntNames.js";

/**
 * Comprehensive manufacturer name mapping for consistent display formatting
 * @readonly
 */
const /**
     * Configuration for manufacturer formatting
     * @readonly
     */
    MANUFACTURER_CONFIG = {
        ERROR_MESSAGES: {
            FORMATTING_ERROR: "Error formatting manufacturer:",
            ID_LOOKUP_ERROR: "Error looking up manufacturer by ID:",
        },
        FALLBACK_NAME: "Unknown Manufacturer",
    },
    MANUFACTURER_MAP = {
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
        faveroElectronics: "Favero Electronics",
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
    if (typeof manufacturer !== "string") {
        return false;
    }
    return manufacturer.toLowerCase().trim() in MANUFACTURER_MAP;
}
