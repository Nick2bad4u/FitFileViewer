import { describe, expect, it } from "vitest";

import { getCreateExportGPXButtonRuntime } from "../../../../../electron-app/utils/files/export/createExportGPXButtonRuntime.js";

describe("getCreateExportGPXButtonRuntime", () => {
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
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateExportGPXButtonRuntime({ document });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("a")).toBeInstanceOf(HTMLAnchorElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("appends elements to the injected document body", () => {
        expect.assertions(2);

        const runtime = getCreateExportGPXButtonRuntime({ document });
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
            URL: {
                createObjectURL(blob): string {
                    createdBlob = blob;
                    return "blob:track";
                },
                revokeObjectURL(url): void {
                    revokedUrl = url;
                },
            },
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
            setTimeout(callback, timeout): ReturnType<typeof setTimeout> {
                scheduledTimeout = timeout;
                callback();
                return 42 as ReturnType<typeof setTimeout>;
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
});
