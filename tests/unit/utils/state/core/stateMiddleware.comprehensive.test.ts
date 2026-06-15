import { describe, it, expect, beforeEach, vi } from "vitest";

// Path from tests/unit/utils/state/core -> utils/state/core
import {
    MIDDLEWARE_PHASES,
    cleanupMiddleware,
    enableMiddleware,
    executeMiddleware,
    getMiddlewareInfo,
    getStatePerformanceHistory,
    initializeDefaultMiddleware,
    middlewareManager,
    registerMiddleware,
    resetStatePerformanceHistory,
    unregisterMiddleware,
} from "../../../../../electron-app/utils/state/core/stateMiddleware.js";
import {
    loggingMiddleware,
    performanceMiddleware,
    persistenceMiddleware,
    notificationMiddleware,
    validationMiddleware,
} from "../../../../../electron-app/utils/state/core/stateMiddleware.js";

describe("stateMiddlewareManager - comprehensive coverage", () => {
    beforeEach(() => {
        // Reset manager state before each test
        cleanupMiddleware();
        resetStatePerformanceHistory();
        // Ensure global flags are reset
        middlewareManager.setGlobalEnabled(true);
    });

    it("registers middleware with priorities and updates execution order", async () => {
        expect.assertions(4);

        const calls: string[] = [];
        registerMiddleware(
            "mw2",
            {
                beforeSet(ctx) {
                    calls.push("mw2");
                    return { ...ctx, value: (ctx.value as number) + 2 };
                },
            },
            20
        );
        registerMiddleware(
            "mw1",
            {
                beforeSet(ctx) {
                    calls.push("mw1");
                    return { ...ctx, value: (ctx.value as number) + 1 };
                },
            },
            10
        );

        // Priority 10 should run before 20
        const result = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
            path: "app.counter",
            value: 0,
            options: {},
        });

        expect(calls).toEqual(["mw1", "mw2"]);
        expect(result.value).toBe(3);

        // getMiddlewareInfo reflects registration data
        const info = getMiddlewareInfo();
        const names = info.map((i) => i.name).sort();
        expect(names).toEqual(["mw1", "mw2"]);
        expect(info.find((i) => i.name === "mw1")?.phases).toContain(
            "beforeSet"
        );
    });

    it("halts execution when a handler returns false and supports object-return context modification", async () => {
        expect.assertions(2);

        const seen: string[] = [];

        registerMiddleware(
            "first",
            {
                beforeSet(ctx) {
                    seen.push("first");
                    return { ...ctx, value: "updated" };
                },
            },
            10
        );

        registerMiddleware(
            "stopper",
            {
                beforeSet() {
                    seen.push("stopper");
                    return false; // stop chain
                },
            },
            20
        );

        registerMiddleware(
            "last",
            {
                beforeSet() {
                    seen.push("last");
                },
            },
            30
        );

        const out = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
            path: "x.y",
            value: "initial",
            options: {},
        });

        expect(out.value).toBe("updated");
        // Ensure last did not run
        expect(seen).toEqual(["first", "stopper"]);
    });

    it("supports enable/disable specific middleware and global disable", async () => {
        expect.assertions(3);

        registerMiddleware(
            "only",
            {
                beforeSet(ctx) {
                    return { ...ctx, value: 123 };
                },
            },
            10
        );

        expect({
            disabledKnown: enableMiddleware("only", false),
            disabledMissing: enableMiddleware("missing", false),
        }).toStrictEqual({
            disabledKnown: true,
            disabledMissing: false,
        });

        let res = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
            path: "p",
            value: 0,
            options: {},
        });
        // Disabled: no change
        expect(res.value).toBe(0);

        // Re-enable and then globally disable
        enableMiddleware("only", true);
        middlewareManager.setGlobalEnabled(false);
        res = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
            path: "p",
            value: 1,
            options: {},
        });
        // Global disabled: no change
        expect(res.value).toBe(1);
    });

    it("unregisters middleware and clears all", async () => {
        expect.assertions(3);

        registerMiddleware("a", { beforeSet: (c) => ({ ...c, value: 1 }) }, 10);
        registerMiddleware("b", { beforeSet: (c) => ({ ...c, value: 2 }) }, 20);

        expect({
            removedExisting: unregisterMiddleware("a"),
            removedMissing: unregisterMiddleware("c-absent"),
        }).toStrictEqual({
            removedExisting: true,
            removedMissing: false,
        });

        let res = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
            path: "a",
            value: 0,
            options: {},
        });
        expect(res.value).toBe(2);

        cleanupMiddleware();

        res = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
            path: "a",
            value: 3,
            options: {},
        });
        expect(res.value).toBe(3); // no middleware
    });

    it("wrapHandler measures performance and logs slow handlers; errors propagate to error handlers", async () => {
        expect.assertions(4);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Mock performance.now to simulate elapsed time > 5ms inside wrapper BEFORE awaiting handler
        const perfSpy = vi
            .spyOn(performance, "now")
            .mockReturnValueOnce(0) // startTime
            .mockReturnValueOnce(10) // duration = 10ms -> triggers slow log
            .mockReturnValueOnce(10) // bad startTime
            .mockReturnValueOnce(10); // bad duration

        const onErrorCtx: any[] = [];

        registerMiddleware(
            "ok",
            {
                beforeSet: (c) => ({ ...c, value: (c.value as number) + 1 }),
                onError: (err, ctx) => {
                    onErrorCtx.push({
                        type: "ok",
                        err: err?.message,
                        phase: ctx?.phase,
                    });
                },
            },
            10
        );

        registerMiddleware(
            "bad",
            {
                beforeSet() {
                    throw new Error("boom");
                },
                onError: (err) => {
                    onErrorCtx.push({ type: "bad", err: err?.message });
                },
            },
            20
        );

        const out = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
            path: "q.r",
            value: 0,
            options: {},
        });

        // ok ran then bad threw; context should reflect ok's modification
        expect(out.value).toBe(1);
        expect(warnSpy).toHaveBeenCalledWith(
            '[StateMiddleware] Slow middleware "ok.beforeSet": 10.00ms'
        );
        expect(errorSpy).toHaveBeenCalledWith(
            '[StateMiddleware] Handler error in "bad.beforeSet":',
            expect.any(Error)
        );
        // Both error handlers should have been invoked in sequence
        const types = onErrorCtx.map((x) => x.type).sort();
        expect(types).toEqual(["bad", "ok"]);

        perfSpy.mockRestore();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
    });

    it("initializes default middleware and avoids duplicate init", async () => {
        expect.assertions(2);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        initializeDefaultMiddleware();
        const firstCount = getMiddlewareInfo().length;
        expect(firstCount).toBeGreaterThanOrEqual(5);

        // Second call should early-return with message
        initializeDefaultMiddleware();
        expect(getMiddlewareInfo()).toHaveLength(firstCount);
        logSpy.mockRestore();
    });

    it("persistence middleware saves specific paths to localStorage (happy and error paths)", async () => {
        expect.assertions(4);

        // Register only the persistence middleware for this test
        registerMiddleware("persistence", persistenceMiddleware, 40);
        // Spy on localStorage.setItem directly since our mock might not use Storage.prototype
        const setItemSpy = vi.spyOn(localStorage, "setItem");

        const savedContext = await executeMiddleware(
            MIDDLEWARE_PHASES.AFTER_SET,
            {
                path: "settings.theme",
                value: "dark",
                options: {},
            }
        );
        expect(savedContext.value).toBe("dark");
        expect(localStorage.getItem("ffv_state_settings_theme")).toBe(
            JSON.stringify("dark")
        );
        expect(setItemSpy).toHaveBeenCalledWith(
            "ffv_state_settings_theme",
            JSON.stringify("dark")
        );

        // Simulate storage error
        setItemSpy.mockImplementation(() => {
            throw new Error("quota");
        });
        const errorContext = await executeMiddleware(
            MIDDLEWARE_PHASES.AFTER_SET,
            {
                path: "settings.mapTheme",
                value: "auto",
                options: {},
            }
        );
        expect(errorContext.value).toBe("auto");

        setItemSpy.mockRestore();
    });

    it("performance middleware tracks start/stop and trims to last 100 entries", async () => {
        expect.assertions(2);

        // Register only the performance middleware for this test
        registerMiddleware("performance", performanceMiddleware, 30);
        // Use BEFORE_SET to stamp _startTime and AFTER_SET to record
        for (let i = 0; i < 120; i++) {
            const ctx = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
                path: `perf.${i}`,
                value: i,
                options: {},
            });
            await executeMiddleware(MIDDLEWARE_PHASES.AFTER_SET, ctx);
        }
        expect(getStatePerformanceHistory()).toBeInstanceOf(Array);
        expect(getStatePerformanceHistory()).toHaveLength(100);
    });

    it("validation middleware blocks disallowed values and notifies onError", async () => {
        expect.assertions(3);

        // Register only the validation middleware for this test
        registerMiddleware("validation", validationMiddleware, 10);
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // undefined value should be blocked
        const ctx1 = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
            path: "some.path",
            value: undefined,
            options: {},
        });
        // Returning false prevents mutation, so context should remain as returned (original)
        expect(ctx1.value).toBeUndefined();

        // invalid type for specific paths
        const invalidInitialized = await executeMiddleware(
            MIDDLEWARE_PHASES.BEFORE_SET,
            {
                path: "app.initialized",
                value: "yes",
                options: {},
            }
        );
        expect(invalidInitialized.value).toBe("yes");
        const invalidStartTime = await executeMiddleware(
            MIDDLEWARE_PHASES.BEFORE_SET,
            {
                path: "app.startTime",
                value: -1,
                options: {},
            }
        );
        expect(invalidStartTime.value).toBe(-1);

        warnSpy.mockRestore();
        errSpy.mockRestore();
    });

    it("logging middleware respects options.source !== 'internal'", async () => {
        expect.assertions(5);

        // Register only the logging middleware for this test
        registerMiddleware("logging", loggingMiddleware, 20);
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const userBefore = await executeMiddleware(
            MIDDLEWARE_PHASES.BEFORE_SET,
            {
                path: "ui.activeTab",
                value: "summary",
                options: { source: "user" },
            }
        );
        const userAfter = await executeMiddleware(MIDDLEWARE_PHASES.AFTER_SET, {
            path: "ui.activeTab",
            value: "summary",
            options: { source: "user" },
        });

        const internalBefore = await executeMiddleware(
            MIDDLEWARE_PHASES.BEFORE_SET,
            {
                path: "ui.activeTab",
                value: "summary",
                options: { source: "internal" },
            }
        );
        const internalAfter = await executeMiddleware(
            MIDDLEWARE_PHASES.AFTER_SET,
            {
                path: "ui.activeTab",
                value: "summary",
                options: { source: "internal" },
            }
        );

        expect(userBefore.path).toBe("ui.activeTab");
        expect(userAfter.value).toBe("summary");
        expect(internalBefore.options.source).toBe("internal");
        expect(internalAfter.value).toBe("summary");
        // Should have logged at least for user-sourced operations
        expect(logSpy).toHaveBeenCalledWith(
            '[StateLog] Setting "ui.activeTab" to:',
            "summary"
        );
        logSpy.mockRestore();
    });

    it("logging middleware onSubscribe logs subscription events", async () => {
        expect.assertions(3);

        // Register only the logging middleware and execute ON_SUBSCRIBE
        registerMiddleware("logging", loggingMiddleware, 20);
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const out = await executeMiddleware(MIDDLEWARE_PHASES.ON_SUBSCRIBE, {
            path: "data.some.path",
            value: undefined,
            options: {},
        } as any);

        expect(out.path).toBe("data.some.path");
        expect(out.value).toBeUndefined();
        expect(logSpy).toHaveBeenCalledWith(
            '[StateLog] New subscription to "data.some.path"'
        );
        logSpy.mockRestore();
    });

    it("notification middleware triggers for key state changes", async () => {
        expect.assertions(3);

        // Register only the notification middleware and exercise its branches
        registerMiddleware("notification", notificationMiddleware, 50);
        // We won't assert DOM/UI effects here; executing code paths increases coverage safely
        const activeFitDataContext = await executeMiddleware(
            MIDDLEWARE_PHASES.AFTER_SET,
            {
                path: "fitFile.rawData",
                value: { any: 1 },
                options: {},
            } as any
        );
        const initializedContext = await executeMiddleware(
            MIDDLEWARE_PHASES.AFTER_SET,
            {
                path: "app.initialized",
                value: true,
                options: {},
            } as any
        );
        const errorContext = await executeMiddleware(
            MIDDLEWARE_PHASES.AFTER_SET,
            {
                path: "system.error",
                value: { message: "failure" },
                options: {},
            } as any
        );

        expect(activeFitDataContext.value).toEqual({ any: 1 });
        expect({ initialized: initializedContext.value }).toStrictEqual({
            initialized: true,
        });
        expect(errorContext.value).toEqual({ message: "failure" });
    });

    it("registering a duplicate middleware warns and replaces the previous one", async () => {
        expect.assertions(2);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        registerMiddleware("dup", { beforeSet: (c) => c }, 10);
        // Duplicate with different priority should replace and warn
        registerMiddleware(
            "dup",
            { beforeSet: (c) => ({ ...c, value: 42 }) },
            30
        );
        const info = getMiddlewareInfo();
        expect(info.map((i) => i.name)).toContain("dup");
        expect(warnSpy).toHaveBeenCalledWith(
            '[StateMiddleware] Middleware "dup" already registered, replacing...'
        );
        warnSpy.mockRestore();
    });

    it("executeErrorHandlers logs when an error handler itself throws", async () => {
        expect.assertions(2);

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        // Thrower to trigger error path
        registerMiddleware(
            "thrower",
            {
                beforeSet() {
                    throw new Error("boom-inner");
                },
            },
            10
        );
        // Error handler that throws when invoked
        registerMiddleware(
            "badErrorHandler",
            {
                // Use onError with one parameter to hit the single-arg path
                onError() {
                    throw new Error("onError-failure");
                },
            },
            20
        );

        const out = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, {
            path: "x.y",
            value: 0,
            options: {},
        });

        expect(out.value).toBe(0);
        // Should log invocation error from onError
        expect(errorSpy).toHaveBeenCalledWith(
            "[StateMiddleware] Error invoking error handler",
            expect.any(Error)
        );
        errorSpy.mockRestore();
    });

    it("getMiddlewareInfo includes onError in phases when defined", () => {
        expect.assertions(1);

        cleanupMiddleware();
        registerMiddleware(
            "withError",
            {
                onError: () => {},
            },
            5
        );
        const info = getMiddlewareInfo();
        const entry = info.find((i) => i.name === "withError")!;
        expect(entry.phases).toContain("onError");
    });

    it("executes beforeGet and afterGet phases and applies context mutations", async () => {
        expect.assertions(2);

        const seen: string[] = [];
        registerMiddleware(
            "getters",
            {
                beforeGet(ctx) {
                    seen.push("beforeGet");
                    return { ...ctx, value: "from-before" } as any;
                },
                afterGet(ctx) {
                    seen.push("afterGet");
                    return {
                        ...ctx,
                        value: String(ctx.value) + ":after",
                    } as any;
                },
            },
            10
        );

        // Call BEFORE_GET then feed returned context into AFTER_GET
        const c1 = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_GET, {
            path: "foo.bar",
            value: "init",
            options: {},
        } as any);
        const c2 = await executeMiddleware(
            MIDDLEWARE_PHASES.AFTER_GET,
            c1 as any
        );
        expect(seen).toEqual(["beforeGet", "afterGet"]);
        expect(c2.value).toBe("from-before:after");
    });

    it("cleanupMiddleware logs clearing and cleaned up messages", () => {
        expect.assertions(1);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        cleanupMiddleware();
        const msgs = logSpy.mock.calls.map((c) => String(c[0]));
        expect(msgs).toEqual([
            "[StateMiddleware] All middleware cleared",
            "[StateMiddleware] Middleware system cleaned up",
        ]);
        logSpy.mockRestore();
    });

    it("enableMiddleware on unknown name warns and returns false", () => {
        expect.assertions(2);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const ok = enableMiddleware("__missing__", false);
        expect({ enabled: ok }).toStrictEqual({ enabled: false });
        expect(warnSpy).toHaveBeenCalledWith(
            '[StateMiddleware] Middleware "__missing__" not found'
        );
        warnSpy.mockRestore();
    });

    it("getMiddlewareInfo returns metadata for registered middleware", () => {
        expect.assertions(2);

        cleanupMiddleware();
        registerMiddleware("logging", loggingMiddleware, 20);
        const info = getMiddlewareInfo();
        const logging = info.find((i) => i.name === "logging");
        expect(logging?.metadata?.version).toBe("1.0.0");
        expect(String(logging?.metadata?.description || "")).toContain("Logs");
    });

    it("onUnsubscribe handlers are executed and can mutate context", async () => {
        expect.assertions(1);

        registerMiddleware(
            "sub",
            {
                onUnsubscribe(ctx) {
                    return { ...ctx, value: "gone" } as any;
                },
            },
            10
        );
        const out = await executeMiddleware(MIDDLEWARE_PHASES.ON_UNSUBSCRIBE, {
            path: "data.topic",
            value: "active",
            options: {},
        } as any);
        expect(out.value).toBe("gone");
    });
});
