import { describe, expect, it, vi } from "vitest";

import {
    getCreateDataPointFilterControlRuntime,
    type CreateDataPointFilterControlRuntimeScope,
} from "../../../../../electron-app/utils/ui/controls/createDataPointFilterControlRuntime.js";

describe("getCreateDataPointFilterControlRuntime", () => {
    it("creates options and abort controllers through injected runtimes", () => {
        expect.assertions(4);

        const runtime = getCreateDataPointFilterControlRuntime({
            getAbortController: () => AbortController,
            getDocument: () => document,
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
            getDocument: () => document,
            getQueueMicrotask: () => queueMicrotaskMock,
        });
        let scheduled = false;

        runtime.scheduleMicrotask(() => {
            scheduled = true;
        });

        expect(scheduled).toBe(true);
        expect(queueMicrotaskMock).toHaveBeenCalledTimes(1);
    });

    it("falls back to a Promise microtask when no scheduler is injected", async () => {
        expect.assertions(1);

        const runtime = getCreateDataPointFilterControlRuntime({
            getDocument: () => document,
        });
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
                getAbortController: () =>
                    "AbortController" as unknown as typeof AbortController,
                getDocument: () => document,
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

    it("ignores legacy direct runtime scope properties", async () => {
        expect.assertions(5);

        const queueMicrotaskMock = vi.fn((callback: VoidFunction) => {
            callback();
        });
        const legacyScope = {
            AbortController,
            document,
            queueMicrotask: queueMicrotaskMock,
        } as unknown as CreateDataPointFilterControlRuntimeScope;
        const runtime = getCreateDataPointFilterControlRuntime(legacyScope);
        let scheduled = false;

        expect(() => runtime.createOption()).toThrow(
            "createDataPointFilterControl requires a document runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createDataPointFilterControl requires an AbortController runtime"
        );

        runtime.scheduleMicrotask(() => {
            scheduled = true;
        });

        expect(scheduled).toBe(false);
        expect(queueMicrotaskMock).not.toHaveBeenCalled();
        await Promise.resolve();
        expect(scheduled).toBe(true);
    });
});
