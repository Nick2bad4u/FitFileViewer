/**
 * Manufacturer and Product ID mappings for FIT files
 * Based on the Garmin FIT SDK and community-maintained lists
 */

// Manufacturer ID to Name mapping
export const MANUFACTURER_IDS = {
    1: "garmin",
    2: "garmin_fr405_antfs",
    3: "zephyr",
    4: "dayton",
    5: "idt",
    6: "srm",
    7: "quarq",
    8: "ibike",
    9: "saris",
    10: "spark_hk",
    11: "tanita",
    12: "echowell",
    13: "dynastream_oem",
    14: "nautilus",
    15: "dynastream",
    16: "timex",
    17: "metrigear",
    18: "xelic",
    19: "beurer",
    20: "cardiosport",
    21: "a_and_d",
    22: "hmm",
    23: "suunto",
    24: "thita_elektronik",
    25: "gpulse",
    26: "clean_mobile",
    27: "pedal_brain",
    28: "peaksware",
    29: "saxonar",
    30: "lemond_fitness",
    31: "dexcom",
    32: "wahoo_fitness",
    33: "octane_fitness",
    34: "archinoetics",
    35: "the_hurt_box",
    36: "citizen_systems",
    37: "magellan",
    38: "osynce",
    39: "holux",
    40: "concept2",
    41: "one_giant_leap",
    42: "ace_sensor",
    43: "brim_brothers",
    44: "xplova",
    45: "perception_digital",
    46: "bf1systems",
    47: "pioneer",
    48: "spantec",
    49: "metalogics",
    50: "4iiiis",
    51: "seiko_epson",
    52: "seiko_epson_oem",
    53: "ifor_powell",
    54: "maxwell_guider",
    55: "star_trac",
    56: "breakaway",
    57: "alatech_technology_ltd",
    58: "mio_technology_europe",
    59: "rotor",
    60: "geonaute",
    61: "id_bike",
    62: "specialized",
    63: "wtek",
    64: "physical_enterprises",
    65: "north_pole_engineering",
    66: "bkool",
    67: "cateye",
    68: "stages_cycling",
    69: "sigmasport",
    70: "tomtom",
    71: "peripedal",
    72: "wattbike",
    73: "moxy",
    74: "ciclosport",
    75: "powerbahn",
    76: "acorn_projects_aps",
    77: "lifebeam",
    78: "bontrager",
    79: "wellgo",
    80: "scosche",
    81: "magura",
    82: "woodway",
    83: "elite",
    84: "nielsen_kellerman",
    85: "dk_city",
    86: "tacx",
    87: "direction_technology",
    88: "magtonic",
    89: "1partcarbon",
    90: "inside_ride_technologies",
    91: "sound_of_motion",
    92: "stryd",
    93: "icg",
    94: "mipulse",
    95: "bsx_athletics",
    96: "look",
    97: "campagnolo_srl",
    98: "body_bike_smart",
    99: "praxisworks",
    100: "limits_technology",
    101: "topaction_technology",
    102: "cosinuss",
    103: "fitcare",
    104: "magene",
    105: "giant_manufacturing_co",
    106: "tigrasport",
    107: "salutron",
    108: "technogym",
    109: "bryton_sensors",
    110: "latitude_limited",
    111: "soaring_technology",
    112: "igpsport",
    113: "thinkrider",
    114: "gopher_sport",
    115: "waterrower",
    116: "orangetheory",
    117: "inpeak",
    118: "kinetic_by_kurt",
    119: "johnson_health_tech",
    120: "polar_electro",
    121: "seesense",
    122: "nci_technology",
    123: "iqsquare",
    124: "leomo",
    125: "ifit_com",
    126: "coros_wearables",
    127: "andriod",
    128: "core",
    129: "locosys",
    130: "fullspeedahead",
    131: "virtualtraining",
    132: "feedbacksports",
    133: "omata",
    134: "vdo",
    135: "magneticdays",
    136: "hammerhead",
    137: "kinetic_by_kurt",
    138: "shapelog",
    139: "dabuziduo",
    140: "jetblack",
    141: "coros",
    142: "virtugo",
    143: "velosense",
    144: "cycligentinc",
    145: "trailforks",
    146: "mahle_ebikemotion",
    147: "nurvv",
    148: "microprogram",
    149: "zone5cloud",
    150: "greenteg",
    151: "yamaha_motors",
    152: "whoop",
    153: "gravaa",
    154: "onelap",
    155: "monark_exercise",
    156: "form",
    157: "decathlon",
    158: "syncros",
    159: "tern_bicycles",
    160: "task2",
    161: "kyto",
    162: "crank_bros",
    163: "box_components",
    164: "racetec",
    165: "raceface",
    166: "easton",
    167: "crankbrothers",
    168: "jeff_labs",
    169: "speedplay",
    170: "heartmath",
    171: "phenix",
    172: "bluehr",
    173: "bmm",
    174: "precor",
    175: "peloton_interactive",
    176: "ray",
    177: "apogee_sports",
    178: "com_it",
    179: "dynastream_innovations",
    180: "verifone",
    181: "lezyne",
    182: "steelseries",
    183: "proformance",
    184: "suunto",
    185: "dexcom",
    186: "lezyne",
    263: "garmin_fr301_china",
    269: "favero_electronics",
    280: "sram",
    281: "zwift",
    65534: "development",
    65535: "actigraphcorp",
};

// Product ID mappings by manufacturer
export const PRODUCT_IDS = {
    // Favero Electronics products
    269: {
        12: "assioma_duo",
        13: "assioma_uno",
        // Add more Favero products as discovered
    },

    // Garmin products (ID: 1)
    1: {
        717: "edge_130",
        1018: "edge_520",
        1169: "edge_520_plus",
        1325: "edge_530",
        1410: "edge_830",
        1499: "edge_130_plus",
        1567: "edge_1030",
        1620: "edge_1030_plus",
        1687: "edge_540",
        1697: "edge_840",
        2713: "forerunner_235",
        2769: "forerunner_735xt",
        2909: "forerunner_935",
        3111: "fenix_5",
        3112: "fenix_5s",
        3113: "fenix_5x",
        3289: "forerunner_645",
        3290: "forerunner_645_music",
        3378: "fenix_5_plus",
        3379: "fenix_5s_plus",
        3380: "fenix_5x_plus",
        3381: "edge_520_plus",
        3441: "forerunner_245",
        3442: "forerunner_245_music",
        3443: "forerunner_945",
        3589: "forerunner_45",
        3590: "forerunner_45s",
        3624: "venu",
        3725: "vivoactive_4",
        3726: "vivoactive_4s",
        3794: "forerunner_745",
        3823: "fenix_6s",
        3824: "fenix_6",
        3825: "fenix_6x",
        3826: "fenix_6s_pro",
        3827: "fenix_6_pro",
        3828: "fenix_6x_pro",
        3829: "fenix_6x_pro_solar",
        3851: "forerunner_55",
        3869: "forerunner_955",
        3870: "forerunner_255",
        3871: "forerunner_255s",
        3872: "forerunner_255_music",
        3873: "forerunner_255s_music",
        // Add more Garmin products as needed
    },

    // Wahoo Fitness products (ID: 32)
    32: {
        1: "kickr_v1",
        2: "kickr_v2",
        3: "kickr_core",
        4: "kickr_v4",
        5: "kickr_v5",
        6: "kickr_bike",
        10: "elemnt",
        11: "elemnt_bolt",
        12: "elemnt_roam",
        13: "elemnt_rival",
        20: "tickr",
        21: "tickr_x",
        22: "tickr_run",
        // Add more Wahoo products as needed
    },

    // Stages Cycling products (ID: 68)
    68: {
        1: "power_meter_gen1",
        2: "power_meter_gen2",
        3: "power_meter_gen3",
        4: "power_meter_lr",
        // Add more Stages products as needed
    },

    // SRAM products (ID: 280)
    280: {
        1: "quarq_dzero",
        2: "quarq_dfour",
        3: "red_etap_axs",
        4: "force_etap_axs",
        5: "rival_etap_axs",
        // Add more SRAM products as needed
    },

    // Add more manufacturers and their products as needed
};

/**
 * Get manufacturer name from ID
 * @param {number|string} manufacturerId - Manufacturer ID
 * @returns {string} Manufacturer name or original value if not found
 */
export function getManufacturerName(manufacturerId) {
    const id = typeof manufacturerId === "string" ? parseInt(manufacturerId, 10) : manufacturerId;
    return MANUFACTURER_IDS[id] || manufacturerId;
}

/**
 * Get product name from manufacturer ID and product ID
 * @param {number|string} manufacturerId - Manufacturer ID
 * @param {number|string} productId - Product ID
 * @returns {string} Product name or original product ID if not found
 */
export function getProductName(manufacturerId, productId) {
    const mfgId = typeof manufacturerId === "string" ? parseInt(manufacturerId, 10) : manufacturerId;
    const prodId = typeof productId === "string" ? parseInt(productId, 10) : productId;

    const manufacturerProducts = PRODUCT_IDS[mfgId];
    if (manufacturerProducts && manufacturerProducts[prodId]) {
        return manufacturerProducts[prodId];
    }

    return productId;
}

/**
 * Get both manufacturer and product names from IDs
 * @param {number|string} manufacturerId - Manufacturer ID
 * @param {number|string} productId - Product ID (optional)
 * @returns {Object} Object with manufacturerName and productName
 */
export function getManufacturerAndProduct(manufacturerId, productId = null) {
    const manufacturerName = getManufacturerName(manufacturerId);
    const productName = productId !== null ? getProductName(manufacturerId, productId) : null;

    return {
        manufacturerName,
        productName,
    };
}

/**
 * Get manufacturer ID from manufacturer name (reverse lookup)
 * @param {string} manufacturerName - Manufacturer name (e.g., "faveroElectronics", "garmin")
 * @returns {number|null} Manufacturer ID or null if not found
 */
export function getManufacturerIdFromName(manufacturerName) {
    if (!manufacturerName || typeof manufacturerName !== "string") {
        return null;
    }

    // Normalize the manufacturer name for comparison
    const normalizedInput = manufacturerName.toLowerCase();

    // Create common variations to check
    const variations = [
        normalizedInput,
        normalizedInput.replace(/([A-Z])/g, "_$1").toLowerCase(), // camelCase to snake_case
        normalizedInput.replace(/_/g, ""), // remove underscores
        normalizedInput.replace(/electronics/g, "_electronics"), // add underscore before electronics
        normalizedInput.replace(/electronics/g, "electronics"), // ensure electronics is present
    ];

    // Search through all manufacturer IDs to find a match
    for (const [id, name] of Object.entries(MANUFACTURER_IDS)) {
        const normalizedName = name.toLowerCase();

        // Check if any variation matches
        if (variations.includes(normalizedName)) {
            return parseInt(id, 10);
        }

        // Also check common variations of the stored name
        const nameVariations = [
            normalizedName,
            normalizedName.replace(/_/g, ""), // remove underscores from stored name
            normalizedName.replace(/_electronics/, "electronics"), // remove underscore before electronics
        ];

        if (nameVariations.includes(normalizedInput)) {
            return parseInt(id, 10);
        }
    }

    return null;
}
