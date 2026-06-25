import { beforeEach, describe, expect, it, vi } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import type { StateListener } from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    FitFileSelectors,
    FitFileStateManager,
} from "../../../../../electron-app/utils/state/domain/fitFileState.js";
import * as syncRendererNotifications from "../../../../../electron-app/utils/ui/notifications/syncRendererNotifications.js";

describe("fitFileStateManager - domain logic and selectors", () => {
    beforeEach(() => {
        // Reset DOM for progress updates
        document.body.replaceChildren();
        const progressElement = document.createElement("div");
        progressElement.id = "file-loading-progress";
        document.body.append(progressElement);
        // Reset state manager between tests to avoid leaked listeners/state
        stateManager.__resetStateManagerForTests();
        vi.restoreAllMocks();
    });

    it("assessDataQuality handles missing/empty and computes coverage/flags", () => {
        expect.assertions(7);

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
        expect({
            hasAltitude: q3.hasAltitude,
            hasAuxHeartRate: q3.hasAuxHeartRate,
            hasCadence: q3.hasCadence,
            hasGPS: q3.hasGPS,
            hasHeartRate: q3.hasHeartRate,
            hasPower: q3.hasPower,
        }).toStrictEqual({
            hasAltitude: true,
            hasAuxHeartRate: false,
            hasCadence: true,
            hasGPS: true,
            hasHeartRate: true,
            hasPower: true,
        });
        // gpsCount=1, hrCount=1 => basicDataCount=1 of 3 => 33% rounded
        expect(q3.completeness).toBe(33);
        expect(q3.coverage).toEqual(
            expect.objectContaining({
                gps: 33,
                heartRate: 33,
                auxHeartRate: 0,
                power: 33,
                cadence: 33,
                altitude: 33,
            })
        );
        expect(q3.issues).toContain("Very short activity");
    });

    it("extractors handle null/valid objects", () => {
        expect.assertions(6);

        const mgr = new FitFileStateManager();
        expect(mgr.extractActivityInfo(null as any)).toBeNull();
        expect(mgr.extractDeviceInfo({} as any)).toBeNull();
        expect(mgr.extractSessionInfo({ sessionMesgs: [] } as any)).toBeNull();

        const activity = mgr.extractActivityInfo({
            activities: [
                {
                    timestamp: 1,
                    total_timer_time: 2,
                    local_timestamp: 3,
                    num_sessions: 4,
                },
            ],
        });
        expect(activity).toEqual({
            timestamp: 1,
            totalTimerTime: 2,
            localTimestamp: 3,
            numSessions: 4,
        });

        const device = mgr.extractDeviceInfo({
            device_infos: [
                {
                    manufacturer: "m",
                    product: "p",
                    serial_number: "s",
                    software_version: 1,
                    hardware_version: 2,
                },
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
        expect.assertions(3);

        const mgr = new FitFileStateManager();
        expect(mgr.getRecordCount(null as any)).toBe(0);
        expect(mgr.getRecordCount({ recordMesgs: [] })).toBe(0);
        expect(
            mgr.getRecordCount({
                recordMesgs: [
                    {},
                    {},
                    {},
                    {},
                    {},
                ],
            })
        ).toBe(5);
    });

    it("clearFileState sets all related paths and logs", () => {
        expect.assertions(14);

        const mgr = new FitFileStateManager();
        stateManager.setState("currentFile", "C:/stale.fit", {
            source: "test",
        });
        stateManager.setState("fitFile.currentFile", "C:/stale.fit", {
            source: "test",
        });
        const spy = vi.spyOn(stateManager, "setState");
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        mgr.clearFileState();
        const calls = spy.mock.calls.map((c) => c[0]);
        // Ensure all expected paths are set
        [
            "fitFile.isLoading",
            "fitFile.currentFile",
            "currentFile",
            "fitFile.rawData",
            "fitFile.processedData",
            "fitFile.validation",
            "fitFile.metrics",
            "fitFile.loadingError",
            "fitFile.processingError",
            "fitFile.loaded",
            "fitFile.loadedFiles",
        ].forEach((p) => expect(calls).toContain(p));
        expect(stateManager.getState("fitFile.loadedFiles")).toStrictEqual([]);
        expect({
            currentFile: stateManager.getState("currentFile"),
            fitFileCurrentFile: stateManager.getState("fitFile.currentFile"),
        }).toStrictEqual({
            currentFile: null,
            fitFileCurrentFile: null,
        });
        expect(logSpy).toHaveBeenCalledWith(
            "[FitFileState] File state cleared"
        );
    });

    it("stores loaded FIT file entries through the explicit domain slice", () => {
        expect.assertions(3);

        const mgr = new FitFileStateManager();
        const loadedFiles = [
            {
                data: { recordMesgs: [] },
                filePath: "overlay.fit",
                originalPath: "C:/rides/overlay.fit",
                sourceKey: "path:c:/rides/overlay.fit",
            },
        ];

        mgr.setLoadedFiles(loadedFiles, "test");

        const selectedFiles = FitFileSelectors.getLoadedFiles();
        expect(selectedFiles).toStrictEqual(loadedFiles);
        expect(selectedFiles).not.toBe(loadedFiles);

        selectedFiles.push({ filePath: "mutated.fit" });
        expect(FitFileSelectors.getLoadedFiles()).toStrictEqual(loadedFiles);
    });

    it("startFileLoading sets loading flags and current file", () => {
        expect.assertions(9);

        const mgr = new FitFileStateManager();
        const spy = vi.spyOn(stateManager, "setState");
        mgr.startFileLoading("C:/file.fit");
        expect(spy).toHaveBeenCalledWith(
            "fitFile.isLoading",
            true,
            expect.any(Object)
        );
        expect(spy).toHaveBeenCalledWith("isLoading", true, expect.any(Object));
        expect(spy).toHaveBeenCalledWith(
            "fitFile.currentFile",
            "C:/file.fit",
            expect.any(Object)
        );
        expect(spy).toHaveBeenCalledWith(
            "currentFile",
            "C:/file.fit",
            expect.any(Object)
        );
        expect(spy).toHaveBeenCalledWith(
            "fitFile.loadingProgress",
            0,
            expect.any(Object)
        );
        expect({
            domainLoading: stateManager.getState("fitFile.isLoading"),
            legacyLoading: stateManager.getState("isLoading"),
        }).toStrictEqual({
            domainLoading: true,
            legacyLoading: true,
        });
        expect({
            currentFile: stateManager.getState("currentFile"),
            fitFileCurrentFile: stateManager.getState("fitFile.currentFile"),
        }).toStrictEqual({
            currentFile: "C:/file.fit",
            fitFileCurrentFile: "C:/file.fit",
        });
        expect(stateManager.getState("fitFile.loadingProgress")).toBe(0);
        expect(stateManager.getState("fitFile.loadingError")).toBeNull();
    });

    it("handleFileLoaded updates domain slices and notifies", () => {
        expect.assertions(13);

        const mgr = new FitFileStateManager();
        const ss = vi.spyOn(stateManager, "setState");
        const notif = vi
            .spyOn(syncRendererNotifications, "showNotification")
            .mockImplementation(() => {});

        stateManager.setState("fitFile.currentFile", "existing.fit", {
            source: "test",
        });

        const data = { recordMesgs: [{}] };
        mgr.handleFileLoaded(data as any, {
            filePath: "C:/demo.fit",
        });

        expect(ss).toHaveBeenCalledWith(
            "fitFile.isLoading",
            false,
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith(
            "fitFile.loadingProgress",
            100,
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith(
            "fitFile.loadingError",
            null,
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith(
            "fitFile.rawData",
            data,
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith(
            "currentFile",
            "C:/demo.fit",
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith(
            "fitFile.currentFile",
            "C:/demo.fit",
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith(
            "charts.isRendered",
            false,
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith(
            "map.isRendered",
            false,
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith(
            "tables.isRendered",
            false,
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith(
            "performance.lastLoadTime",
            expect.any(Number),
            expect.any(Object)
        );
        expect(ss).toHaveBeenCalledWith("isLoading", false, expect.any(Object));
        expect(notif).toHaveBeenCalledWith(
            "FIT file loaded successfully",
            "success",
            3000
        );
        expect({
            chartsRendered: stateManager.getState("charts.isRendered"),
            currentFile: stateManager.getState("currentFile"),
            fitFileCurrentFile: stateManager.getState("fitFile.currentFile"),
            isLoading: stateManager.getState("fitFile.isLoading"),
            loadingPhase: stateManager.getState("fitFile.loadingPhase"),
            loadingError: stateManager.getState("fitFile.loadingError"),
            loadingProgress: stateManager.getState("fitFile.loadingProgress"),
            loadingState: stateManager.getState("fitFile.loadingState"),
            mapRendered: stateManager.getState("map.isRendered"),
            rawData: stateManager.getState("fitFile.rawData"),
            tablesRendered: stateManager.getState("tables.isRendered"),
        }).toEqual({
            chartsRendered: false,
            currentFile: "C:/demo.fit",
            fitFileCurrentFile: "C:/demo.fit",
            isLoading: false,
            loadingPhase: "loaded",
            loadingError: null,
            loadingProgress: 100,
            loadingState: expect.objectContaining({
                error: null,
                filePath: "C:/demo.fit",
                phase: "loaded",
                progress: 100,
            }),
            mapRendered: false,
            rawData: data,
            tablesRendered: false,
        });
    });

    it("handleFileLoadingError records error once and notifies", () => {
        expect.assertions(4);

        const mgr = new FitFileStateManager();
        const ss = vi.spyOn(stateManager, "setState");
        const notif = vi
            .spyOn(syncRendererNotifications, "showNotification")
            .mockImplementation(() => {});

        mgr.handleFileLoadingError(new Error("oops"));
        expect(ss).toHaveBeenCalledWith(
            "fitFile.isLoading",
            false,
            expect.any(Object)
        );
        const loadingErrorCalls = ss.mock.calls.filter(
            (call) => call[0] === "fitFile.loadingError"
        );
        expect(loadingErrorCalls).toHaveLength(1);
        expect(loadingErrorCalls[0]).toEqual([
            "fitFile.loadingError",
            "oops",
            expect.any(Object),
        ]);
        expect(notif).toHaveBeenCalledWith(
            "Failed to load FIT file: oops",
            "error",
            5000
        );
    });

    it("handleFileLoadingError ignores nullish and duplicate normalized values", () => {
        expect.assertions(6);

        const mgr = new FitFileStateManager();
        const ss = vi.spyOn(stateManager, "setState");
        const notif = vi
            .spyOn(syncRendererNotifications, "showNotification")
            .mockImplementation(() => {});
        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        mgr.handleFileLoadingError(null as any);
        expect(ss).not.toHaveBeenCalled();
        expect(notif).not.toHaveBeenCalled();
        expect(consoleSpy).not.toHaveBeenCalled();
        expect(stateManager.getState("fitFile.loadingError")).toBeNull();

        // Seed state with an existing normalized message and ensure duplicate notifications are skipped.
        stateManager.setState("fitFile.loadingError", "dupe", {
            source: "test",
        });
        ss.mockClear();
        notif.mockClear();
        consoleSpy.mockClear();

        mgr.handleFileLoadingError("dupe");

        expect({
            consoleCalls: consoleSpy.mock.calls.length,
            notificationCalls: notif.mock.calls.length,
            setStateCalls: ss.mock.calls.length,
        }).toEqual({
            consoleCalls: 0,
            notificationCalls: 0,
            setStateCalls: 0,
        });
        expect(stateManager.getState("fitFile.loadingError")).toBe("dupe");

        consoleSpy.mockRestore();
    });

    it("processFileData sets processedData; error path sets processingError", () => {
        expect.assertions(3);

        const mgr = new FitFileStateManager();
        mgr.processFileData({ recordMesgs: [{ heart_rate: 100 }] });
        const payload = stateManager.getState("fitFile.processedData");
        expect(payload).toEqual(
            expect.objectContaining({
                activityInfo: null,
                deviceInfo: null,
                recordCount: 1,
                sessionInfo: null,
            })
        );
        expect(payload.dataQuality).toEqual(
            expect.objectContaining({
                completeness: 100,
                hasGPS: false,
                hasHeartRate: true,
            })
        );

        // Force error path
        const errMgr = new FitFileStateManager();
        vi.spyOn(errMgr, "assessDataQuality").mockImplementation(() => {
            throw new Error("bad");
        });
        const ss2 = vi.spyOn(stateManager, "setState");
        errMgr.processFileData({ recordMesgs: [{}] });
        expect(ss2).toHaveBeenCalledWith(
            "fitFile.processingError",
            "bad",
            expect.any(Object)
        );
    });

    it("sets up subscriptions for processing, loading, and validation", () => {
        expect.assertions(4);

        const subscribeCalls: Array<{ cb: StateListener; path: string }> = [];
        const subSpy = vi
            .spyOn(stateManager, "subscribe")
            .mockImplementation((path: string, cb: StateListener) => {
                subscribeCalls.push({ path, cb });
                return () => {
                    // no-op unsubscribe for test callback capture
                };
            });

        const mgr = new FitFileStateManager();
        // Should subscribe to these paths at minimum
        const paths = subscribeCalls.map((c) => c.path);
        expect(paths).toEqual(
            expect.arrayContaining([
                "fitFile.rawData",
                "fitFile.processedData",
                "fitFile.loadingProgress",
                "fitFile.loaded",
                "fitFile.loadingError",
            ])
        );

        // Trigger data processing subscriber(s)
        const procSubs = subscribeCalls.filter(
            (c) => c.path === "fitFile.rawData"
        );
        const pSpy = vi.spyOn(mgr, "processFileData");
        const vSpy = vi.spyOn(mgr, "validateFileData");
        const recordPayload = { recordMesgs: [{}] };
        for (const subscription of procSubs) {
            subscription.cb(recordPayload, undefined, "fitFile.rawData");
        }
        expect(pSpy).toHaveBeenCalledWith(recordPayload);
        expect(vSpy).toHaveBeenCalledWith(recordPayload);

        // Trigger metrics update
        const mSpy = vi.spyOn(mgr, "updateFileMetrics");
        const fitSubs = subscribeCalls.filter(
            (c) => c.path === "fitFile.processedData"
        );
        const processedPayload = {
            dataQuality: { completeness: 75 },
            recordCount: 2,
        };
        for (const subscription of fitSubs) {
            subscription.cb(
                processedPayload,
                undefined,
                "fitFile.processedData"
            );
        }
        expect(mSpy).toHaveBeenCalledWith(processedPayload);

        subSpy.mockRestore();
    });

    it("updateFileMetrics merges metrics into state", () => {
        expect.assertions(2);

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
        expect(stateManager.getState("fitFile.metrics")).toEqual(
            expect.objectContaining({
                dataQualityScore: 70,
                hasDevice: false,
                hasSession: false,
                recordCount: 10,
            })
        );
    });

    it("updateLoadingProgress updates ui.loadingIndicator state", () => {
        expect.assertions(2);

        const mgr = new FitFileStateManager();
        const uspy = vi.spyOn(stateManager, "updateState");
        mgr.updateLoadingProgress(30);
        expect(uspy).toHaveBeenCalledWith(
            "ui.loadingIndicator",
            { active: true, progress: 30 },
            expect.objectContaining({
                source: "FitFileStateManager.updateLoadingProgress",
            })
        );
        expect(stateManager.getState("ui.loadingIndicator")).toEqual({
            active: true,
            progress: 30,
        });
    });

    it("transitionLoadingPhase enforces the FIT-file loading state machine", () => {
        expect.assertions(8);

        const mgr = new FitFileStateManager();

        expect(
            mgr.transitionLoadingPhase("selecting", {
                filePath: null,
                source: "test.selecting",
            })
        ).toBe(true);
        expect(
            mgr.transitionLoadingPhase("reading", {
                filePath: "C:/ride.fit",
                progress: 12,
                source: "test.reading",
            })
        ).toBe(true);
        expect(
            mgr.transitionLoadingPhase("parsing", {
                filePath: "C:/ride.fit",
                source: "test.parsing",
            })
        ).toBe(true);
        expect(
            mgr.transitionLoadingPhase("selecting", {
                source: "test.invalid",
            })
        ).toBe(false);
        expect(FitFileSelectors.getLoadingPhase()).toBe("parsing");
        expect(FitFileSelectors.isLoading()).toBe(true);
        expect(FitFileSelectors.getLoadingState()).toEqual(
            expect.objectContaining({
                error: null,
                filePath: "C:/ride.fit",
                phase: "parsing",
                progress: 65,
            })
        );

        mgr.handleFileLoadingError(new Error("bad parse"));
        expect(FitFileSelectors.getLoadingState()).toEqual(
            expect.objectContaining({
                error: "bad parse",
                phase: "error",
            })
        );
    });

    it("validateFileData sets validation, shows error/warning/happy notifications", () => {
        expect.assertions(6);

        const mgr = new FitFileStateManager();
        const ss = vi.spyOn(stateManager, "setState");
        const notif = vi
            .spyOn(syncRendererNotifications, "showNotification")
            .mockImplementation(() => {});

        // No data -> error
        mgr.validateFileData(null as any);
        expect(ss).toHaveBeenCalledWith(
            "fitFile.validation",
            expect.objectContaining({ isValid: false }),
            expect.any(Object)
        );
        expect(stateManager.getState("fitFile.validation")).toEqual(
            expect.objectContaining({
                errors: ["No data provided"],
                isValid: false,
            })
        );
        expect(notif).toHaveBeenCalledWith(
            "File validation failed: No data provided",
            "error"
        );

        // Missing pieces -> warnings
        ss.mockClear();
        notif.mockClear();
        mgr.validateFileData({ recordMesgs: [{}] } as any);
        const call = ss.mock.calls.find((c) => c[0] === "fitFile.validation");
        expect(call?.[1]).toEqual(
            expect.objectContaining({
                isValid: true,
                warnings: expect.arrayContaining([
                    "No session data found",
                    "No file ID information",
                ]),
            })
        );
        expect(stateManager.getState("fitFile.validation")).toEqual(
            expect.objectContaining({
                isValid: true,
                warnings: expect.arrayContaining([
                    "No session data found",
                    "No file ID information",
                ]),
            })
        );
        expect(notif).toHaveBeenCalledWith(
            "File loaded with warnings: No session data found, No file ID information",
            "warning"
        );
    });

    it("fitFileSelectors read values from state", () => {
        expect.assertions(2);

        // Use real state manager setters
        stateManager.setState("fitFile.currentFile", "A", { source: "test" });
        stateManager.setState("fitFile.loadingError", "ERR", {
            source: "test",
        });
        stateManager.setState("fitFile.loadingProgress", 42, {
            source: "test",
        });
        stateManager.setState(
            "fitFile.metrics",
            { recordCount: 1 },
            { source: "test" }
        );
        stateManager.setState(
            "fitFile.processedData",
            {
                dataQuality: {
                    hasGPS: true,
                    hasHeartRate: false,
                    hasPower: true,
                },
            },
            { source: "test" }
        );
        stateManager.setState(
            "fitFile.validation",
            { isValid: true },
            { source: "test" }
        );
        stateManager.setState("fitFile.isLoading", true, { source: "test" });
        const rawData = {
            eventMesgs: [{ event: "start" }],
            lapMesgs: [{ total_elapsed_time: 120 }],
            recordMesgs: [{ timestamp: 1 }],
            sessionMesgs: [{ sport: "cycling" }],
            timeInZoneMesgs: [{ referenceMesg: "lap" }],
        };
        stateManager.setState("fitFile.rawData", rawData, {
            source: "test",
        });

        expect({
            currentFile: FitFileSelectors.getCurrentFile(),
            loadingError: FitFileSelectors.getLoadingError(),
            loadingPhase: FitFileSelectors.getLoadingPhase(),
            loadingProgress: FitFileSelectors.getLoadingProgress(),
            metrics: FitFileSelectors.getMetrics(),
            messageArrays: {
                event: FitFileSelectors.getEventMessages(),
                lap: FitFileSelectors.getLapMessages(),
                record: FitFileSelectors.getRecordMessages(),
                session: FitFileSelectors.getSessionMessages(),
                timeInZone: FitFileSelectors.getTimeInZoneMessages(),
            },
            processedData: FitFileSelectors.getProcessedData(),
            rawData: FitFileSelectors.getRawData(),
            validation: FitFileSelectors.getValidation(),
        }).toEqual({
            currentFile: "A",
            loadingError: "ERR",
            loadingPhase: "idle",
            loadingProgress: 42,
            messageArrays: {
                event: [{ event: "start" }],
                lap: [{ total_elapsed_time: 120 }],
                record: [{ timestamp: 1 }],
                session: [{ sport: "cycling" }],
                timeInZone: [{ referenceMesg: "lap" }],
            },
            metrics: { recordCount: 1 },
            processedData: {
                dataQuality: {
                    hasGPS: true,
                    hasHeartRate: false,
                    hasPower: true,
                },
            },
            rawData,
            validation: { isValid: true },
        });
        expect({
            hasGPS: FitFileSelectors.hasGPS(),
            hasHeartRate: FitFileSelectors.hasHeartRate(),
            hasPower: FitFileSelectors.hasPower(),
            isFileValid: FitFileSelectors.isFileValid(),
            isLoading: FitFileSelectors.isLoading(),
        }).toEqual({
            hasGPS: true,
            hasHeartRate: false,
            hasPower: true,
            isFileValid: true,
            isLoading: true,
        });
    });

    it("fitFileSelectors ignore compatibility global data when domain raw data is loaded", () => {
        expect.assertions(1);

        stateManager.setState(
            "globalData",
            {
                recordMesgs: [{ timestamp: 1 }],
                sessionMesgs: [{ sport: "running" }],
            },
            { source: "test" }
        );
        stateManager.setState(
            "fitFile.rawData",
            {
                recordMesgs: [{ timestamp: 2 }],
                sessionMesgs: [{ sport: "cycling" }],
            },
            { source: "test" }
        );

        expect({
            rawData: FitFileSelectors.getRawData(),
            records: FitFileSelectors.getRecordMessages(),
            sessions: FitFileSelectors.getSessionMessages(),
        }).toStrictEqual({
            rawData: {
                recordMesgs: [{ timestamp: 2 }],
                sessionMesgs: [{ sport: "cycling" }],
            },
            records: [{ timestamp: 2 }],
            sessions: [{ sport: "cycling" }],
        });
    });
});
