import { getManufacturerName } from "./formatAntNames.js";

/**
 * Formats manufacturer names for display
 * @param {string|number} manufacturer - Raw manufacturer name or ID
 * @returns {string} Formatted manufacturer name
 */

export function formatManufacturer(manufacturer) {
    // If it's a number, try to get the name from the ID mapping first
    if (typeof manufacturer === "number" || !isNaN(manufacturer)) {
        const nameFromId = getManufacturerName(manufacturer);
        if (nameFromId !== manufacturer) {
            // Found a match in ID mapping, now format it
            manufacturer = nameFromId;
        }
    }

    const manufacturerMap = {
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
    return manufacturerMap[manufacturer] || manufacturer;
}
