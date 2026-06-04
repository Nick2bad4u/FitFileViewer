/**
 * Physics-based virtual power estimation for cycling activities.
 *
 * This is intentionally a pragmatic model, not an attempt to perfectly match a
 * power meter. It estimates crank power from gravity, rolling resistance,
 * aerodynamic drag, and inertial acceleration.
 */

const EARTH_RADIUS_M = 6_371_000;
const SEMICIRCLE_TO_DEG = 180 / 2 ** 31;
const GRAVITY = 9.806_65;

type FitRecord = Record<string, unknown>;

/**
 * Settings used by the cycling power estimator.
 */
export interface PowerEstimationSettings {
    bikeWeightKg: number;
    cda: number;
    crr: number;
    drivetrainEfficiency: number;
    enabled: boolean;
    gradeWindowMeters: number;
    maxPowerW: number;
    riderWeightKg: number;
    windSpeedMps: number;
}

/**
 * Result from applying estimated power to record messages.
 */
export interface PowerEstimationResult {
    applied: boolean;
    estimatedPowerW: number[];
}

/**
 * Estimate power per record and attach it to each record as `estimatedPower`.
 *
 * @param params - Records, optional session metadata, and estimation settings.
 *
 * @returns Estimated power values and whether they were applied.
 */
export function applyEstimatedPowerToRecords({
    recordMesgs,
    sessionMesgs,
    settings,
}: {
    recordMesgs: FitRecord[];
    sessionMesgs?: readonly FitRecord[];
    settings: PowerEstimationSettings;
}): PowerEstimationResult {
    const s = normalizePowerEstimationSettings(settings);
    if (!s.enabled) {
        return { applied: false, estimatedPowerW: [] };
    }

    if (!Array.isArray(recordMesgs) || recordMesgs.length === 0) {
        return { applied: false, estimatedPowerW: [] };
    }

    if (hasPowerData(recordMesgs)) {
        return { applied: false, estimatedPowerW: [] };
    }

    const sport = getSessionSport(sessionMesgs);
    if (sport && !sport.includes("cycl") && !sport.includes("bike")) {
        return { applied: false, estimatedPowerW: [] };
    }

    const massKg = s.riderWeightKg + s.bikeWeightKg;
    const tSec: number[] = [];
    const vMps: number[] = [];
    const altM: number[] = [];
    const distM: number[] = [];

    let lastDist = 0;
    let lastLat: number | null = null;
    let lastLon: number | null = null;
    let lastTimeSec: number | null = null;

    for (const record of recordMesgs) {
        const ts = toDateOrNull(record["timestamp"]);
        const rawTime = ts
            ? ts.getTime() / 1000
            : toFiniteNumberOrNull(record["timestamp"]);
        const timeSec =
            typeof rawTime === "number" && Number.isFinite(rawTime)
                ? rawTime
                : null;

        const speed =
            toFiniteNumberOrNull(record["enhanced_speed"]) ??
            toFiniteNumberOrNull(record["speed"]) ??
            0;

        const altitude =
            toFiniteNumberOrNull(record["enhanced_altitude"]) ??
            toFiniteNumberOrNull(record["altitude"]) ??
            0;

        const cumulative = resolveCumulativeDistance({
            lastDist,
            lastLat,
            lastLon,
            lastTimeSec,
            record,
            speed,
            timeSec,
        });

        const lat = toDegreesOrNull(
            record["position_lat"] ?? record["positionLat"]
        );
        const lon = toDegreesOrNull(
            record["position_long"] ?? record["positionLong"]
        );
        if (lat !== null && lon !== null) {
            lastLat = lat;
            lastLon = lon;
        }

        if (timeSec !== null) {
            lastTimeSec = timeSec;
        }

        lastDist = cumulative;

        tSec.push(timeSec ?? previousNumber(tSec));
        vMps.push(Math.max(0, speed));
        altM.push(altitude);
        distM.push(cumulative);
    }

    const grade = calculateGrade(distM, altM, s.gradeWindowMeters);
    const accel = calculateAcceleration(tSec, vMps);
    const estimated: number[] = [];

    for (const [i, rec] of recordMesgs.entries()) {
        const v = vMps[i] ?? 0;
        const theta = Math.atan(grade[i] ?? 0);
        const rho = airDensityFromAltitude(altM[i] ?? 0);
        const vRel = Math.max(0, v + s.windSpeedMps);

        const fGrav = massKg * GRAVITY * Math.sin(theta);
        const fRoll = s.crr * massKg * GRAVITY * Math.cos(theta);
        const fAero = 0.5 * rho * s.cda * vRel * vRel;
        const fAccel = massKg * (accel[i] ?? 0);

        const pWheel = (fGrav + fRoll + fAero + fAccel) * v;
        const pCrank = pWheel / s.drivetrainEfficiency;

        const p = Math.max(0, Math.min(s.maxPowerW, pCrank));
        estimated.push(p);
        rec["estimatedPower"] = p;
    }

    return { applied: true, estimatedPowerW: estimated };
}

/**
 * Determines whether an activity already has real power data.
 *
 * @param recordMesgs - FIT record messages.
 *
 * @returns `true` when a positive real power value is present.
 */
export function hasPowerData(recordMesgs: readonly FitRecord[]): boolean {
    for (const record of recordMesgs) {
        const power = toFiniteNumberOrNull(record["power"]);
        if (power !== null && power > 0) {
            return true;
        }

        const enhancedPower = toFiniteNumberOrNull(record["enhanced_power"]);
        if (enhancedPower !== null && enhancedPower > 0) {
            return true;
        }
    }
    return false;
}

function getSessionSport(sessionMesgs?: readonly FitRecord[]): string {
    const session0 = Array.isArray(sessionMesgs) ? sessionMesgs[0] : undefined;
    const sport = session0?.["sport"];
    return typeof sport === "string" ? sport.toLowerCase() : "";
}

function resolveCumulativeDistance({
    lastDist,
    lastLat,
    lastLon,
    lastTimeSec,
    record,
    speed,
    timeSec,
}: {
    lastDist: number;
    lastLat: number | null;
    lastLon: number | null;
    lastTimeSec: number | null;
    record: FitRecord;
    speed: number;
    timeSec: number | null;
}): number {
    const distance = toFiniteNumberOrNull(record["distance"]);
    if (distance !== null && distance >= 0) {
        return Math.max(lastDist, distance);
    }

    const lat = toDegreesOrNull(
        record["position_lat"] ?? record["positionLat"]
    );
    const lon = toDegreesOrNull(
        record["position_long"] ?? record["positionLong"]
    );

    if (lat !== null && lon !== null && lastLat !== null && lastLon !== null) {
        return lastDist + haversineDistanceM(lastLat, lastLon, lat, lon);
    }

    if (lastTimeSec !== null && timeSec !== null && timeSec > lastTimeSec) {
        return lastDist + speed * (timeSec - lastTimeSec);
    }

    return lastDist;
}

function calculateGrade(
    distM: readonly number[],
    altM: readonly number[],
    gradeWindowM: number
): number[] {
    const grade = Array.from({ length: distM.length }, () => 0);
    let j = 0;

    for (let i = 0; i < distM.length; i += 1) {
        const currentDistance = distM[i] ?? 0;
        while (j < i && currentDistance - (distM[j] ?? 0) > gradeWindowM) {
            j += 1;
        }

        const k = Math.max(0, j - 1);
        const previousDistance = distM[k] ?? 0;
        const ds = currentDistance - previousDistance;
        if (ds > 1) {
            const g = ((altM[i] ?? 0) - (altM[k] ?? 0)) / ds;
            grade[i] = Math.max(-0.3, Math.min(0.3, g));
        }
    }

    return grade;
}

function calculateAcceleration(
    tSec: readonly number[],
    vMps: readonly number[]
): number[] {
    const accel = Array.from({ length: tSec.length }, () => 0);

    for (let i = 1; i < tSec.length; i += 1) {
        const dt = Math.max(0.001, (tSec[i] ?? 0) - (tSec[i - 1] ?? 0));
        const dv = (vMps[i] ?? 0) - (vMps[i - 1] ?? 0);
        const a = dv / dt;
        accel[i] = Math.max(-3, Math.min(3, a));
    }

    return accel;
}

function airDensityFromAltitude(altitudeM: number): number {
    const rho0 = 1.225;
    const rho =
        rho0 * Math.exp(-Math.max(-500, Math.min(9000, altitudeM)) / 8500);
    return Math.max(0.5, Math.min(1.3, rho));
}

function haversineDistanceM(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_M * c;
}

function normalizePowerEstimationSettings(
    settings: PowerEstimationSettings
): PowerEstimationSettings {
    return {
        bikeWeightKg:
            Number.isFinite(settings.bikeWeightKg) && settings.bikeWeightKg > 0
                ? settings.bikeWeightKg
                : 10,
        cda:
            Number.isFinite(settings.cda) && settings.cda > 0
                ? settings.cda
                : 0.32,
        crr:
            Number.isFinite(settings.crr) && settings.crr > 0
                ? settings.crr
                : 0.004,
        drivetrainEfficiency:
            Number.isFinite(settings.drivetrainEfficiency) &&
            settings.drivetrainEfficiency > 0 &&
            settings.drivetrainEfficiency <= 1
                ? settings.drivetrainEfficiency
                : 0.97,
        enabled: settings.enabled,
        gradeWindowMeters:
            Number.isFinite(settings.gradeWindowMeters) &&
            settings.gradeWindowMeters >= 5
                ? settings.gradeWindowMeters
                : 35,
        maxPowerW:
            Number.isFinite(settings.maxPowerW) && settings.maxPowerW > 100
                ? settings.maxPowerW
                : 2000,
        riderWeightKg:
            Number.isFinite(settings.riderWeightKg) &&
            settings.riderWeightKg > 20
                ? settings.riderWeightKg
                : 75,
        windSpeedMps: Number.isFinite(settings.windSpeedMps)
            ? settings.windSpeedMps
            : 0,
    };
}

function toDateOrNull(value: unknown): Date | null {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
        return value;
    }
    if (typeof value === "string") {
        const date = new Date(value);
        return Number.isFinite(date.getTime()) ? date : null;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        const ms = value > 10_000_000_000 ? value : value * 1000;
        const date = new Date(ms);
        return Number.isFinite(date.getTime()) ? date : null;
    }
    return null;
}

function toDegreesOrNull(raw: unknown): number | null {
    const n = toFiniteNumberOrNull(raw);
    if (n === null) {
        return null;
    }

    if (Math.abs(n) > 180) {
        return n * SEMICIRCLE_TO_DEG;
    }

    return n;
}

function toFiniteNumberOrNull(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

function previousNumber(values: readonly number[]): number {
    return values.length > 0 ? (values.at(-1) ?? 0) : 0;
}
