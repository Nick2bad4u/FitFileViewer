import { describe, expect, it, vi } from "vitest";

import {
    getUserDeviceInfoBoxRuntime,
    type UserDeviceInfoBoxRuntimeScope,
} from "../../../../../electron-app/utils/rendering/components/createUserDeviceInfoBoxRuntime.js";

describe("getUserDeviceInfoBoxRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("user-device-info-box-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getUserDeviceInfoBoxRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getUserDeviceInfoBoxRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getUserDeviceInfoBoxRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow(
            "createUserDeviceInfoBox requires an AbortController runtime"
        );
    });

    it("creates elements through the injected document runtime", () => {
        expect.assertions(3);

        const documentRef = document.implementation.createHTMLDocument(
            "user device info box"
        );
        const createElement = vi.spyOn(documentRef, "createElement");
        const runtime = getUserDeviceInfoBoxRuntime({
            getDocument: () => documentRef,
        });

        const element = runtime.createElement("section");

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.tagName).toBe("SECTION");
        expect(createElement).toHaveBeenCalledWith("section");
    });

    it("creates elements through browser document providers", () => {
        expect.assertions(2);

        const runtime = getUserDeviceInfoBoxRuntime();
        const element = runtime.createElement("section");

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.tagName).toBe("SECTION");
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getUserDeviceInfoBoxRuntime({});

        expect(() => {
            runtime.createElement("div");
        }).toThrow("createUserDeviceInfoBox requires a document runtime");
    });

    it("ignores legacy direct runtime primitive properties", () => {
        expect.assertions(2);

        class TestAbortController implements AbortController {
            public readonly signal = Symbol(
                "legacy-user-device-info-box-signal"
            ) as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getUserDeviceInfoBoxRuntime({
            AbortController: TestAbortController,
            document,
        } as unknown as UserDeviceInfoBoxRuntimeScope);

        expect(() => {
            runtime.createAbortController();
        }).toThrow(
            "createUserDeviceInfoBox requires an AbortController runtime"
        );
        expect(() => {
            runtime.createElement("div");
        }).toThrow("createUserDeviceInfoBox requires a document runtime");
    });
});
