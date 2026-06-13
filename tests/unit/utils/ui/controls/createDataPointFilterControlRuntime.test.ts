import { describe, expect, it, vi } from "vitest";

import { getCreateDataPointFilterControlRuntime } from "../../../../../electron-app/utils/ui/controls/createDataPointFilterControlRuntime.js";

describe("getCreateDataPointFilterControlRuntime", () => {
    it("creates options and abort controllers through injected runtimes", () => {
        expect.assertions(4);

        const runtime = getCreateDataPointFilterControlRuntime({
            AbortController,
            document,
        });
        const abortController = runtime.createAbortController();
        const option = runtime.createOption();

        expect(abortController).toBeInstanceOf(AbortController);
        expect(abortController.signal.aborted).toBe(false);
        expect(option).toBeInstanceOf(HTMLOptionElement);
        expect(option.tagName).toBe("OPTION");
    });

    it("schedules microtasks through the injected scheduler", () => {
        expect.assertions(2);

        const queueMicrotaskMock = vi.fn((callback: VoidFunction) => {
            callback();
        });
        const runtime = getCreateDataPointFilterControlRuntime({
            document,
            queueMicrotask: queueMicrotaskMock,
        });
        let scheduled = false;

        runtime.scheduleMicrotask(() => {
            scheduled = true;
        });

        expect(scheduled).toBe(true);
        expect(queueMicrotaskMock).toHaveBeenCalledTimes(1);
    });

    it("falls back to the browser microtask scheduler when no scheduler is injected", async () => {
        expect.assertions(1);

        const runtime = getCreateDataPointFilterControlRuntime({ document });
        let scheduled = false;

        runtime.scheduleMicrotask(() => {
            scheduled = true;
        });
        await Promise.resolve();

        expect(scheduled).toBe(true);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getCreateDataPointFilterControlRuntime({});
        const runtimeWithInvalidAbortController =
            getCreateDataPointFilterControlRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
            });

        expect(() => runtime.createOption()).toThrow(
            "createDataPointFilterControl requires a document runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createDataPointFilterControl requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "createDataPointFilterControl requires an AbortController runtime"
        );
    });
});
