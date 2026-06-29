import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getCreateDataPointFilterControlRuntime,
    type CreateDataPointFilterControlRuntimeScope,
} from "../../../../../electron-app/utils/ui/controls/createDataPointFilterControlRuntime.js";

describe("getCreateDataPointFilterControlRuntime", () => {
    const unavailableDataPointFilterControlRuntimeScope = {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        getQueueMicrotask: () => undefined,
    } satisfies Parameters<typeof getCreateDataPointFilterControlRuntime>[0];

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates options and abort controllers through injected runtimes", () => {
        expect.assertions(4);

        const runtime = getCreateDataPointFilterControlRuntime({
            ...unavailableDataPointFilterControlRuntimeScope,
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

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getCreateDataPointFilterControlRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production document and microtask defaults", () => {
        expect.assertions(3);

        const queueMicrotaskMock = vi.fn((callback: VoidFunction) => {
            callback();
        });

        vi.stubGlobal("document", document);
        vi.stubGlobal("queueMicrotask", queueMicrotaskMock);

        const runtime = getCreateDataPointFilterControlRuntime();
        let scheduled = false;

        runtime.scheduleMicrotask(() => {
            scheduled = true;
        });

        expect(runtime.createOption()).toBeInstanceOf(HTMLOptionElement);
        expect(scheduled).toBe(true);
        expect(queueMicrotaskMock).toHaveBeenCalledOnce();
    });

    it("schedules microtasks through the injected scheduler", () => {
        expect.assertions(2);

        const queueMicrotaskMock = vi.fn((callback: VoidFunction) => {
            callback();
        });
        const runtime = getCreateDataPointFilterControlRuntime({
            ...unavailableDataPointFilterControlRuntimeScope,
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
            ...unavailableDataPointFilterControlRuntimeScope,
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

        const runtime = getCreateDataPointFilterControlRuntime(
            unavailableDataPointFilterControlRuntimeScope
        );
        const runtimeWithInvalidAbortController =
            getCreateDataPointFilterControlRuntime({
                ...unavailableDataPointFilterControlRuntimeScope,
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
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

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(3);

        const runtime = getCreateDataPointFilterControlRuntime(
            {} as unknown as Parameters<
                typeof getCreateDataPointFilterControlRuntime
            >[0]
        );

        expect(() => runtime.createOption()).toThrow(
            "createDataPointFilterControl requires a document provider"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createDataPointFilterControl requires an AbortController provider"
        );
        expect(() => runtime.scheduleMicrotask(() => {})).toThrow(
            "createDataPointFilterControl requires a queueMicrotask provider"
        );
    });

    it("ignores legacy direct runtime scope properties", async () => {
        expect.assertions(5);

        const queueMicrotaskMock = vi.fn((callback: VoidFunction) => {
            callback();
        });
        const legacyScope = {
            ...unavailableDataPointFilterControlRuntimeScope,
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
