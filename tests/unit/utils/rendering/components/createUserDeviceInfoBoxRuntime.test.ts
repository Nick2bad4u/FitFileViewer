import { describe, expect, it } from "vitest";

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

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getUserDeviceInfoBoxRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow(
            "createUserDeviceInfoBox requires an AbortController runtime"
        );
    });

    it("ignores legacy direct AbortController scope properties", () => {
        expect.assertions(1);

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
        } as unknown as UserDeviceInfoBoxRuntimeScope);

        expect(() => {
            runtime.createAbortController();
        }).toThrow(
            "createUserDeviceInfoBox requires an AbortController runtime"
        );
    });
});
