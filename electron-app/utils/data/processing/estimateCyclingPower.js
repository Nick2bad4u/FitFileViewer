/**
 * @file Physics-based "virtual power" estimation for cycling activities.
 *
 *   This is intentionally a pragmatic model, not an attempt to perfectly match a
 *   power meter. It estimates crank power from:
 *
 *   - Gravity (grade)
 *   - Rolling resistance
 *   - Aerodynamic drag
 *   - Inertial acceleration
 */

const EARTH_RADIUS_M = 6_371_000;
const SEMICIRCLE_TO_DEG = 180 / 2 ** 31;
const GRAVITY = 9.806_65;

/**
 * @typedef {object} PowerEstimationSettings
 *
 * @property {boolean} enabled
 * @property {number} riderWeightKg
 * @property {number} bikeWeightKg
 * @property {number} crr
 * @property {number} cda
 * @property {number} drivetrainEfficiency
 * @property {number} windSpeedMps
 * @property {number} gradeWindowMeters
 * @property {number} maxPowerW
 */

/**
 * @typedef {object} PowerEstimationResult
 *
 * @property {number[]} estimatedPowerW
 * @property {boolean} applied
 */

/**
 * Estimate power (W) per record and attach it to each record as
 * `estimatedPower`.
 *
 * @param {{
 *     recordMesgs: Record<string, unknown>[];
 *     sessionMesgs?: Record<string, unknown>[];
 *     settings: PowerEstimationSettings;
 * }} params
 *
 * @returns {PowerEstimationResult}
 */
export function applyEstimatedPowerToRecords({
    recordMesgs,
    sessionMesgs,
    settings,
}) {
    const s = normalizePowerEstimationSettings(settings);
    if (!s.enabled) {
        return { applied: false, estimatedPowerW: [] };
    }

    if (!Array.isArray(recordMesgs) || recordMesgs.length === 0) {
        return { applied: false, estimatedPowerW: [] };
    }

    if (hasPowerData(recordMesgs)) {
        // Don't overwrite real power.
        return { applied: false, estimatedPowerW: [] };
    }
    // If sport is known and not cycling, skip estimation.
    // (FIT sport strings are typically "cycling", "running", etc. after parsing.)
    try {
        const session0 = Array.isArray(sessionMesgs)
            ? /** @type {any} */ (sessionMesgs)[0]
            : null;
        const sport =
            typeof session0?.sport === "string"
                ? session0.sport.toLowerCase()
                : "";
        if (sport && !sport.includes("cycl") && !sport.includes("bike")) {
            return { applied: false, estimatedPowerW: [] };
        }
    } catch {
        /* ignore */
    }

    const massKg = s.riderWeightKg + s.bikeWeightKg;

    /** @type {number[]} */
    const tSec = [];
    /** @type {number[]} */
    const vMps = [];
    /** @type {number[]} */
    const altM = [];
    /** @type {number[]} */
    const distM = [];

    let lastDist = 0;
    let lastLat = null;
    let lastLon = null;
    let lastTimeSec = null;

    for (const r of recordMesgs) {
        const anyR = /** @type {any} */ (r);

        const ts = toDateOrNull(anyR.timestamp);
        const t = ts
            ? ts.getTime() / 1000
            : toFiniteNumberOrNull(anyR.timestamp);
        const timeSec = typeof t === "number" && Number.isFinite(t) ? t : null;

        // Prefer enhanced speed if present.
        const speed =
            toFiniteNumberOrNull(anyR.enhanced_speed) ??
            toFiniteNumberOrNull(anyR.speed) ??
            0;

        const altitude =
            toFiniteNumberOrNull(anyR.enhanced_altitude) ??
            toFiniteNumberOrNull(anyR.altitude) ??
            0;

        // Distance is often cumulative meters.
        const d = toFiniteNumberOrNull(anyR.distance);

        let cumulative = lastDist;
        if (d !== null && d >= 0) {
            cumulative = Math.max(lastDist, d);
        } else {
            // Fall back: integrate along GPS if we can, otherwise integrate speed.
            const lat = toDegreesOrNull(anyR.position_lat ?? anyR.positionLat);
            const lon = toDegreesOrNull(
                anyR.position_long ?? anyR.positionLong
            );

            if (
                lat !== null &&
                lon !== null &&
                lastLat !== null &&
                lastLon !== null
            ) {
                cumulative =
                    lastDist + haversineDistanceM(lastLat, lastLon, lat, lon);
            } else if (
                lastTimeSec !== null &&
                timeSec !== null &&
                timeSec > lastTimeSec
            ) {
                cumulative = lastDist + speed * (timeSec - lastTimeSec);
            }

            if (lat !== null && lon !== null) {
                lastLat = lat;
                lastLon = lon;
            }
        }

        if (timeSec !== null) {
            lastTimeSec = timeSec;
        }

        lastDist = cumulative;

        tSec.push(timeSec ?? (tSec.length > 0 ? tSec.at(-1) : 0));
        vMps.push(Math.max(0, speed));
        altM.push(altitude);
        distM.push(cumulative);
    }

    // Grade computed via distance window to reduce noise.
    const gradeWindowM = s.gradeWindowMeters;
    /** @type {number[]} */
    const grade = Array.from({ length: recordMesgs.length }, () => 0);
    let j = 0;
    for (let i = 0; i < recordMesgs.length; i++) {
        while (j < i && distM[i] - distM[j] > gradeWindowM) {
            j++;
        }
        const k = Math.max(0, j - 1);
        const ds = distM[i] - distM[k];
        if (ds > 1) {
            const g = (altM[i] - altM[k]) / ds;
            grade[i] = Math.max(-0.3, Math.min(0.3, g));
        }
    }

    // Acceleration (simple) with clamping.
    /** @type {number[]} */
    const accel = Array.from({ length: recordMesgs.length }, () => 0);
    for (let i = 1; i < recordMesgs.length; i++) {
        const dt = Math.max(0.001, tSec[i] - tSec[i - 1]);
        const dv = vMps[i] - vMps[i - 1];
        const a = dv / dt;
        accel[i] = Math.max(-3, Math.min(3, a));
    }

    /** @type {number[]} */
    const estimated = [];

    for (const [i, rec] of recordMesgs.entries()) {
        const v = vMps[i];
        const theta = Math.atan(grade[i]);
        const rho = airDensityFromAltitude(altM[i]);
        const vRel = Math.max(0, v + s.windSpeedMps);

        const fGrav = massKg * GRAVITY * Math.sin(theta);
        const fRoll = s.crr * massKg * GRAVITY * Math.cos(theta);
        const fAero = 0.5 * rho * s.cda * vRel * vRel;
        const fAccel = massKg * accel[i];

        const pWheel = (fGrav + fRoll + fAero + fAccel) * v;
        const pCrank = pWheel / s.drivetrainEfficiency;

        const p = Math.max(0, Math.min(s.maxPowerW, pCrank));
        estimated.push(p);

        // Attach to record for tooltip/map usage.
        /** @type {any} */ (rec).estimatedPower = p;
    }

    return { applied: true, estimatedPowerW: estimated };
}

/**
 * Determine if the activity already has real power data.
 *
 * @param {Record<string, unknown>[]} recordMesgs
 *
 * @returns {boolean}
 */
export function hasPowerData(recordMesgs) {
    for (const r of recordMesgs) {
        const p = toFiniteNumberOrNull(/** @type {any} */ (r).power);
        if (p !== null && p > 0) {
            return true;
        }
        const ep = toFiniteNumberOrNull(/** @type {any} */ (r).enhanced_power);
        if (ep !== null && ep > 0) {
            return true;
        }
    }
    return false;
}

/**
 * Very simple air density estimate as a function of altitude.
 *
 * @param {number} altitudeM
 *
 * @returns {number}
 */
function airDensityFromAltitude(altitudeM) {
    // Scale height approximation.
    const rho0 = 1.225;
    const rho =
        rho0 * Math.exp(-Math.max(-500, Math.min(9000, altitudeM)) / 8500);
    return Math.max(0.5, Math.min(1.3, rho));
}

/**
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 *
 * @returns {number}
 */
function haversineDistanceM(lat1, lon1, lat2, lon2) {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_M * c;
}

/**
 * @param {PowerEstimationSettings} s
 *
 * @returns {PowerEstimationSettings}
 */
function normalizePowerEstimationSettings(s) {
    return {
        enabled: s.enabled === true,
        riderWeightKg:
            Number.isFinite(s.riderWeightKg) && s.riderWeightKg > 20
                ? s.riderWeightKg
                : 75,
        bikeWeightKg:
            Number.isFinite(s.bikeWeightKg) && s.bikeWeightKg > 0
                ? s.bikeWeightKg
                : 10,
        crr: Number.isFinite(s.crr) && s.crr > 0 ? s.crr : 0.004,
        cda: Number.isFinite(s.cda) && s.cda > 0 ? s.cda : 0.32,
        drivetrainEfficiency:
            Number.isFinite(s.drivetrainEfficiency) &&
            s.drivetrainEfficiency > 0 &&
            s.drivetrainEfficiency <= 1
                ? s.drivetrainEfficiency
                : 0.97,
        windSpeedMps: Number.isFinite(s.windSpeedMps) ? s.windSpeedMps : 0,
        gradeWindowMeters:
            Number.isFinite(s.gradeWindowMeters) && s.gradeWindowMeters >= 5
                ? s.gradeWindowMeters
                : 35,
        maxPowerW:
            Number.isFinite(s.maxPowerW) && s.maxPowerW > 100
                ? s.maxPowerW
                : 2000,
    };
}

/**
 * @param {unknown} value
 *
 * @returns {Date | null}
 */
function toDateOrNull(value) {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
        return value;
    }
    if (typeof value === "string") {
        const d = new Date(value);
        return Number.isFinite(d.getTime()) ? d : null;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        // FIT timestamps can be seconds or ms depending on normalization.
        const ms = value > 10_000_000_000 ? value : value * 1000;
        const d = new Date(ms);
        return Number.isFinite(d.getTime()) ? d : null;
    }
    return null;
}

/**
 * @param {unknown} raw
 *
 * @returns {number | null}
 */
function toDegreesOrNull(raw) {
    const n = toFiniteNumberOrNull(raw);
    if (n === null) {
        return null;
    }

    // Heuristic: Garmin FIT positions are often stored as signed 32-bit semicircles.
    // If the magnitude is way outside degrees range, treat as semicircles.
    if (Math.abs(n) > 180) {
        return n * SEMICIRCLE_TO_DEG;
    }

    return n;
}

/**
 * @param {unknown} v
 *
 * @returns {number | null}
 */
function toFiniteNumberOrNull(v) {
    if (typeof v === "number" && Number.isFinite(v)) {
        return v;
    }
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

/**
 * @param {number} deg
 */
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
