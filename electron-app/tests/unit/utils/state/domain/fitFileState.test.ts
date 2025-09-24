import { beforeEach, describe, expect, it, vi } from "vitest";

import * as stateManager from "../../../../../utils/state/core/stateManager.js";
import { AppActions } from "../../../../../utils/app/lifecycle/appActions.js";
import * as rendererUtils from "../../../../../utils/app/initialization/rendererUtils.js";
import { FitFileSelectors, FitFileStateManager } from "../../../../../utils/state/domain/fitFileState.js";

describe("FitFileStateManager - domain logic and selectors", () => {
    beforeEach(() => {
        // Reset DOM for progress updates
        document.body.innerHTML = '<div id="file-loading-progress"></div>';
        // Reset state manager between tests to avoid leaked listeners/state
        stateManager.__resetStateManagerForTests();
        vi.restoreAllMocks();
    });

    it("assessDataQuality handles missing/empty and computes coverage/flags", () => {
        const mgr = new FitFileStateManager();
        // No data
        const q1 = mgr.assessDataQuality(undefined as any);
        expect(q1.issues).toContain("No record data found");
        expect(q1.completeness).toBe(0);

        // Empty records
        const q2 = mgr.assessDataQuality({ recordMesgs: [] });
        expect(q2.issues).toContain("No records in file");

        // Mixed data
        const q3 = mgr.assessDataQuality({
            recordMesgs: [
                { position_lat: 1, position_long: 2, heart_rate: 120 }, // gps+hr
                { cadence: 80 },
                { power: 200, altitude: 300 },
            ],
        });
        expect(q3.hasGPS).toBe(true);
        expect(q3.hasHeartRate).toBe(true);
        expect(q3.hasPower).toBe(true);
        expect(q3.hasCadence).toBe(true);
        expect(q3.hasAltitude).toBe(true);
        // gpsCount=1, hrCount=1 => basicDataCount=1 of 3 => 33% rounded
        expect(q3.completeness).toBe(33);
        expect(q3.coverage).toEqual(
            expect.objectContaining({ gps: 33, heartRate: 33, power: 33, cadence: 33, altitude: 33 })
        );
        expect(q3.issues).toContain("Very short activity");
    });

    it("extractors handle null/valid objects", () => {
        const mgr = new FitFileStateManager();
        expect(mgr.extractActivityInfo(null as any)).toBeNull();
        expect(mgr.extractDeviceInfo(/** @type any */ {})).toBeNull();
        expect(mgr.extractSessionInfo(/** @type any */ { sessionMesgs: [] })).toBeNull();

        const activity = mgr.extractActivityInfo({
            activities: [{ timestamp: 1, total_timer_time: 2, local_timestamp: 3, num_sessions: 4 }],
        });
        expect(activity).toEqual({ timestamp: 1, totalTimerTime: 2, localTimestamp: 3, numSessions: 4 });

        const device = mgr.extractDeviceInfo({
            device_infos: [
                { manufacturer: "m", product: "p", serial_number: "s", software_version: 1, hardware_version: 2 },
            ],
        });
        expect(device).toEqual({
            manufacturer: "m",
            product: "p",
            serialNumber: "s",
            softwareVersion: 1,
            hardwareVersion: 2,
        });

        const session = mgr.extractSessionInfo({
            sessionMesgs: [
                {
                    start_time: 10,
                    total_elapsed_time: 11,
                    total_distance: 12,
                    total_calories: 13,
                    sport: "s",
                    sub_sport: "ss",
                },
            ],
        });
        expect(session).toEqual({
            startTime: 10,
            totalElapsedTime: 11,
            totalDistance: 12,
            totalCalories: 13,
            sport: "s",
            subSport: "ss",
        });
    });

    it("getRecordCount handles null and arrays", () => {
        const mgr = new FitFileStateManager();
        expect(mgr.getRecordCount(null as any)).toBe(0);
        expect(mgr.getRecordCount({ recordMesgs: [] })).toBe(0);
        expect(mgr.getRecordCount({ recordMesgs: [{}, {}, {}, {}, {}] })).toBe(5);
    });

    it("clearFileState sets all related paths and logs", () => {
        const mgr = new FitFileStateManager();
        const spy = vi.spyOn(stateManager, "setState");
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        mgr.clearFileState();
        const calls = spy.mock.calls.map((c) => c[0]);
        // Ensure all expected paths are set
        [
            "fitFile.isLoading",
            "fitFile.currentFile",
            "fitFile.rawData",
            "fitFile.processedData",
            "fitFile.validation",
            "fitFile.metrics",
            "fitFile.loadingError",
            "fitFile.processingError",
        ].forEach((p) => expect(calls).toContain(p));
        expect(logSpy).toHaveBeenCalled();
    });

    it("startFileLoading sets loading flags and current file", () => {
        const mgr = new FitFileStateManager();
        const spy = vi.spyOn(stateManager, "setState");
        mgr.startFileLoading("C:/file.fit");
        expect(spy).toHaveBeenCalledWith("fitFile.isLoading", true, expect.any(Object));
        expect(spy).toHaveBeenCalledWith("fitFile.currentFile", "C:/file.fit", expect.any(Object));
        expect(spy).toHaveBeenCalledWith("fitFile.loadingProgress", 0, expect.any(Object));
    });

    it("handleFileLoaded updates states, calls AppActions and notifies", () => {
        const mgr = new FitFileStateManager();
        const ss = vi.spyOn(stateManager, "setState");
        const act = vi.spyOn(AppActions, "loadFile").mockResolvedValue(undefined);
        const notif = vi.spyOn(rendererUtils, "showNotification").mockImplementation(() => {});

        const data = { recordMesgs: [{}] };
        mgr.handleFileLoaded(/** @type any */ data);

        expect(ss).toHaveBeenCalledWith("fitFile.isLoading", false, expect.any(Object));
        expect(ss).toHaveBeenCalledWith("fitFile.loadingProgress", 100, expect.any(Object));
        expect(ss).toHaveBeenCalledWith("fitFile.rawData", data, expect.any(Object));
        expect(act).toHaveBeenCalled();
        expect(notif).toHaveBeenCalledWith("FIT file loaded successfully", "success", 3000);
    });

    it("handleFileLoadingError records error and notifies", () => {
        const mgr = new FitFileStateManager();
        const ss = vi.spyOn(stateManager, "setState");
        const notif = vi.spyOn(rendererUtils, "showNotification").mockImplementation(() => {});

        mgr.handleFileLoadingError(new Error("oops"));
        expect(ss).toHaveBeenCalledWith("fitFile.isLoading", false, expect.any(Object));
        expect(ss).toHaveBeenCalledWith("fitFile.loadingError", "oops", expect.any(Object));
        expect(notif).toHaveBeenCalled();
    });

    it("processFileData sets processedData; error path sets processingError", () => {
        const mgr = new FitFileStateManager();
        const ss = vi.spyOn(stateManager, "setState");
        mgr.processFileData({ recordMesgs: [{ heart_rate: 100 }] });
        const processedCall = ss.mock.calls.find((c) => c[0] === "fitFile.processedData");
        expect(processedCall).toBeTruthy();
        const payload = processedCall?.[1];
        expect(payload.recordCount).toBe(1);
        expect(payload.dataQuality).toBeTruthy();

        // Force error path
        const errMgr = new FitFileStateManager();
        vi.spyOn(errMgr, "assessDataQuality").mockImplementation(() => {
            throw new Error("bad");
        });
        const ss2 = vi.spyOn(stateManager, "setState");
        errMgr.processFileData({ recordMesgs: [{}] });
        expect(ss2).toHaveBeenCalledWith("fitFile.processingError", "bad", expect.any(Object));
    });

    it("sets up subscriptions for processing, loading, and validation", () => {
        const subscribeCalls: Array<{ path: string; cb: Function }> = [];
        const subSpy = vi.spyOn(stateManager, "subscribe").mockImplementation((path: string, cb: Function) => {
            subscribeCalls.push({ path, cb });
            return () => {};
        });

        const mgr = new FitFileStateManager();
        // Should subscribe to these paths at minimum
        const paths = subscribeCalls.map((c) => c.path);
        expect(paths).toEqual(
            expect.arrayContaining([
                "globalData",
                "fitFile.processedData",
                "fitFile.loadingProgress",
                "fitFile.loaded",
                "fitFile.loadingError",
            ])
        );

        // Trigger data processing subscriber(s)
        const procSubs = subscribeCalls.filter((c) => c.path === "globalData");
        const pSpy = vi.spyOn(mgr, "processFileData");
        const vSpy = vi.spyOn(mgr, "validateFileData");
        procSubs.forEach((s) => s.cb({ recordMesgs: [{}] }));
        expect(pSpy).toHaveBeenCalled();
        expect(vSpy).toHaveBeenCalled();

        // Trigger metrics update
        const mSpy = vi.spyOn(mgr, "updateFileMetrics");
        const fitSubs = subscribeCalls.filter((c) => c.path === "fitFile.processedData");
        fitSubs.forEach((s) => s.cb({ recordCount: 2, dataQuality: { completeness: 75 } }));
        expect(mSpy).toHaveBeenCalled();

        subSpy.mockRestore();
    });

    it("updateFileMetrics merges metrics into state", () => {
        const mgr = new FitFileStateManager();
        const uspy = vi.spyOn(stateManager, "updateState");
        mgr.updateFileMetrics({
            recordCount: 10,
            deviceInfo: null,
            sessionInfo: null,
            dataQuality: {
                completeness: 70,
                hasAltitude: false,
                hasCadence: false,
                hasGPS: false,
                hasHeartRate: false,
                hasPower: false,
                issues: [],
            },
            activityInfo: null,
        } as any);
        expect(uspy).toHaveBeenCalledWith(
            "fitFile.metrics",
            expect.objectContaining({
                recordCount: 10,
                hasDevice: false,
                hasSession: false,
                dataQualityScore: 70,
            }),
            expect.any(Object)
        );
    });

    it("updateLoadingProgress updates ui.loadingIndicator state", () => {
        const mgr = new FitFileStateManager();
        const uspy = vi.spyOn(stateManager, "updateState");
        mgr.updateLoadingProgress(30);
        expect(uspy).toHaveBeenCalledWith(
            "ui.loadingIndicator",
            { active: true, progress: 30 },
            expect.objectContaining({ source: "FitFileStateManager.updateLoadingProgress" })
        );
    });

    it("validateFileData sets validation, shows error/warning/happy notifications", () => {
        const mgr = new FitFileStateManager();
        const ss = vi.spyOn(stateManager, "setState");
        const notif = vi.spyOn(rendererUtils, "showNotification").mockImplementation(() => {});

        // No data -> error
        mgr.validateFileData(null as any);
        expect(ss).toHaveBeenCalledWith(
            "fitFile.validation",
            expect.objectContaining({ isValid: false }),
            expect.any(Object)
        );
        expect(notif).toHaveBeenCalled();

        // Missing pieces -> warnings
        ss.mockClear();
        notif.mockClear();
        mgr.validateFileData({ recordMesgs: [{}] } as any);
        const call = ss.mock.calls.find((c) => c[0] === "fitFile.validation");
        expect(call?.[1]).toEqual(
            expect.objectContaining({
                isValid: true,
                warnings: expect.arrayContaining(["No session data found", "No file ID information"]),
            })
        );
        expect(notif).toHaveBeenCalled();
    });

    it("FitFileSelectors read values from state", () => {
        // Use real state manager setters
        stateManager.setState("fitFile.currentFile", "A", { source: "test" });
        stateManager.setState("fitFile.loadingError", "ERR", { source: "test" });
        stateManager.setState("fitFile.loadingProgress", 42, { source: "test" });
        stateManager.setState("fitFile.metrics", { recordCount: 1 }, { source: "test" });
        stateManager.setState(
            "fitFile.processedData",
            { dataQuality: { hasGPS: true, hasHeartRate: false, hasPower: true } },
            { source: "test" }
        );
        stateManager.setState("fitFile.validation", { isValid: true }, { source: "test" });
        stateManager.setState("fitFile.isLoading", true, { source: "test" });

        expect(FitFileSelectors.getCurrentFile()).toBe("A");
        expect(FitFileSelectors.getLoadingError()).toBe("ERR");
        expect(FitFileSelectors.getLoadingProgress()).toBe(42);
        expect(FitFileSelectors.getMetrics()).toEqual({ recordCount: 1 });
        expect(FitFileSelectors.getProcessedData()).toEqual({
            dataQuality: { hasGPS: true, hasHeartRate: false, hasPower: true },
        });
        expect(FitFileSelectors.getValidation()).toEqual({ isValid: true });
        expect(FitFileSelectors.hasGPS()).toBe(true);
        expect(FitFileSelectors.hasHeartRate()).toBe(false);
        expect(FitFileSelectors.hasPower()).toBe(true);
        expect(FitFileSelectors.isFileValid()).toBe(true);
        expect(FitFileSelectors.isLoading()).toBe(true);
    });
});
