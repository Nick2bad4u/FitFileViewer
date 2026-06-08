import { getActiveFitRawData } from "./activeFitRawDataState.js";

export type FitUserProfileData = {
    readonly activityClass?: string;
    readonly age?: number;
    readonly defaultMaxBikingHeartRate?: number;
    readonly defaultMaxHeartRate?: number;
    readonly defaultMaxRunningHeartRate?: number;
    readonly depthSetting?: string;
    readonly distSetting?: string;
    readonly diveCount?: number;
    readonly elevSetting?: string;
    readonly friendlyName?: string;
    readonly gender?: string;
    readonly globalId?: string;
    readonly height?: number;
    readonly heightSetting?: string;
    readonly hrSetting?: string;
    readonly language?: string;
    readonly localId?: number;
    readonly positionSetting?: string;
    readonly powerSetting?: string;
    readonly restingHeartRate?: number;
    readonly sleepTime?: string;
    readonly speedSetting?: string;
    readonly temperatureSetting?: string;
    readonly userRunningStepLength?: number;
    readonly userWalkingStepLength?: number;
    readonly wakeTime?: string;
    readonly weight?: number;
    readonly weightSetting?: string;
};

export type FitDeviceInfo = {
    readonly antNetwork?: string;
    readonly batteryStatus?: string;
    readonly batteryVoltage?: number;
    readonly descriptor?: string;
    readonly deviceIndex?: number | string;
    readonly deviceType?: string;
    readonly garminProduct?: string;
    readonly hardwareVersion?: number;
    readonly manufacturer?: number | string;
    readonly product?: number | string;
    readonly productName?: string;
    readonly serialNumber?: number | string;
    readonly softwareVersion?: number;
    readonly sourceType?: string;
};

export type ActiveFitUserDeviceData = {
    deviceInfos: FitDeviceInfo[];
    rawData: Record<string, unknown> | null;
    userProfile: FitUserProfileData;
    userProfiles: FitUserProfileData[];
};

export function getActiveFitUserDeviceData(
    sourceData?: unknown
): ActiveFitUserDeviceData {
    const activeSourceData =
        sourceData === undefined ? getActiveFitRawData() : sourceData;
    const rawData = isRecord(activeSourceData) ? activeSourceData : null;
    const userProfiles = getRecordArray<FitUserProfileData>(
        rawData?.["userProfileMesgs"]
    );

    return {
        deviceInfos: getRecordArray<FitDeviceInfo>(
            rawData?.["deviceInfoMesgs"]
        ),
        rawData,
        userProfile: userProfiles[0] ?? {},
        userProfiles,
    };
}

function getRecordArray<T extends Record<string, unknown>>(
    value: unknown
): T[] {
    return Array.isArray(value)
        ? value.filter((entry): entry is T => isRecord(entry))
        : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
