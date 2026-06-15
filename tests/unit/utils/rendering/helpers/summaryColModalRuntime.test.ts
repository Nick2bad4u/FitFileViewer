import { describe, expect, it } from "vitest";

import { getSummaryColModalRuntime } from "../../../../../electron-app/utils/rendering/helpers/summaryColModalRuntime.js";

describe("getSummaryColModalRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("summary-col-modal-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getSummaryColModalRuntime({
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getSummaryColModalRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("summaryColModal requires an AbortController runtime");
    });

    it("reads viewport dimensions from an injected runtime scope", () => {
        expect.assertions(1);

        expect(
            getSummaryColModalRuntime({
                innerHeight: 900,
                innerWidth: 1440,
            }).getViewport()
        ).toStrictEqual({
            height: 900,
            width: 1440,
        });
    });

    it("uses zero dimensions when viewport values are unavailable", () => {
        expect.assertions(1);

        expect(getSummaryColModalRuntime({}).getViewport()).toStrictEqual({
            height: 0,
            width: 0,
        });
    });
});
