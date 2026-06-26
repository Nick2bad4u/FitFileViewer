import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserSetTimeout,
    BrowserTimerHandle,
    BrowserURLConstructor,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getCreateExportGPXButtonRuntime,
    type CreateExportGPXButtonRuntimeScope,
} from "../../../../../electron-app/utils/files/export/createExportGPXButtonRuntime.js";

describe("getCreateExportGPXButtonRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("create-export-gpx-button-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getCreateExportGPXButtonRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getCreateExportGPXButtonRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateExportGPXButtonRuntime({
            getDocument: () => document,
        });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("a")).toBeInstanceOf(HTMLAnchorElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("appends elements to the injected document body", () => {
        expect.assertions(2);

        const runtime = getCreateExportGPXButtonRuntime({
            getDocument: () => document,
        });
        const link = runtime.createElement("a");

        runtime.appendToBody(link);

        expect(link.isConnected).toBe(true);
        expect(document.body.contains(link)).toBe(true);

        link.remove();
    });

    it("uses the injected URL runtime", () => {
        expect.assertions(3);

        let createdBlob: Blob | undefined;
        let revokedUrl = "";
        const runtime = getCreateExportGPXButtonRuntime({
            getURL: () => ({
                createObjectURL(blob): string {
                    createdBlob = blob;
                    return "blob:track";
                },
                revokeObjectURL(url): void {
                    revokedUrl = url;
                },
            }),
        });
        const blob = new Blob(["track"]);

        expect(runtime.createObjectURL(blob)).toBe("blob:track");
        expect(createdBlob).toBe(blob);

        runtime.revokeObjectURL("blob:track");

        expect(revokedUrl).toBe("blob:track");
    });

    it("uses the injected timeout scheduler", () => {
        expect.assertions(3);

        let callbackRan = false;
        let scheduledTimeout = 0;
        const runtime = getCreateExportGPXButtonRuntime({
            getSetTimeout:
                () =>
                (callback, timeout): BrowserTimerHandle => {
                    scheduledTimeout = timeout;
                    callback();
                    return 42 as BrowserTimerHandle;
                },
        });
        const cleanupDelayMs = Number.parseInt("100", 10);

        const handle = runtime.setTimeout(() => {
            callbackRan = true;
        }, cleanupDelayMs);

        expect(handle).toBe(42);
        expect(callbackRan).toBe(true);
        expect(scheduledTimeout).toBe(cleanupDelayMs);
    });

    it("uses browser runtime providers for production timeout defaults", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const cleanupDelayMs = Number.parseInt("100", 10);
        const timer = 17 as BrowserTimerHandle;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);

        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getCreateExportGPXButtonRuntime();
        const timerHandle = runtime.setTimeout(callback, cleanupDelayMs);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, cleanupDelayMs);
        expect(callback).not.toHaveBeenCalled();
        expect(setTimeoutMock).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production document and URL defaults", () => {
        expect.assertions(7);

        const createObjectURL = vi.fn<(blob: Blob) => string>(
            () => "blob:track"
        );
        const revokeObjectURL = vi.fn<(url: string) => void>();
        const urlRuntime = {
            createObjectURL,
            revokeObjectURL,
        } satisfies Pick<
            BrowserURLConstructor,
            "createObjectURL" | "revokeObjectURL"
        >;
        const blob = new Blob(["track"]);

        vi.stubGlobal("document", document);
        vi.stubGlobal("URL", urlRuntime);

        const runtime = getCreateExportGPXButtonRuntime();
        const link = runtime.createElement("a");

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(link).toBeInstanceOf(HTMLAnchorElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
        expect(runtime.createObjectURL(blob)).toBe("blob:track");

        runtime.appendToBody(link);
        runtime.revokeObjectURL("blob:track");

        expect(link.isConnected).toBe(true);
        expect(createObjectURL).toHaveBeenCalledWith(blob);
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:track");

        link.remove();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(1);

        const runtime = getCreateExportGPXButtonRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "createExportGPXButton requires a setTimeout runtime"
        );
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getCreateExportGPXButtonRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "createExportGPXButton requires an AbortController runtime"
        );
        expect(() => runtime.createButton()).toThrow(
            "createExportGPXButton requires a document runtime"
        );
        expect(() => runtime.createObjectURL(new Blob(["track"]))).toThrow(
            "createExportGPXButton requires a URL runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        let controllerCount = 0;
        const signal = Symbol("legacy-create-export-gpx-button-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const legacyScope = {
            AbortController: TestAbortController,
            document,
            setTimeout,
            URL,
        } as unknown as CreateExportGPXButtonRuntimeScope;
        const runtime = getCreateExportGPXButtonRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "createExportGPXButton requires an AbortController runtime"
        );
        expect(() => runtime.createButton()).toThrow(
            "createExportGPXButton requires a document runtime"
        );
        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "createExportGPXButton requires a setTimeout runtime"
        );
        expect(controllerCount).toBe(0);
    });
});
