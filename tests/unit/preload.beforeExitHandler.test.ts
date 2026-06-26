import { describe, expect, it, vi } from "vitest";
import { registerPreloadBeforeExitHandler } from "../../electron-app/preload/beforeExitHandler.js";

type BeforeExitCallback = (...args: unknown[]) => void;
type BeforeExitWrapper = BeforeExitCallback & {
    listener?: BeforeExitCallback;
};

function createProcessFixture(): {
    readonly beforeExitListeners: BeforeExitWrapper[];
    readonly processRef: NodeJS.Process;
    readonly removeListener: ReturnType<typeof vi.fn>;
} {
    const beforeExitListeners: BeforeExitWrapper[] = [];
    const removeListener = vi.fn(
        (eventName: string, listener: BeforeExitCallback): void => {
            if (eventName !== "beforeExit") {
                return;
            }

            const listenerIndex = beforeExitListeners.indexOf(listener);
            if (listenerIndex >= 0) {
                beforeExitListeners.splice(listenerIndex, 1);
            }
        }
    );
    const processRef = {
        listeners(eventName: string) {
            return eventName === "beforeExit" ? [...beforeExitListeners] : [];
        },
        once(eventName: string, listener: BeforeExitCallback) {
            if (eventName === "beforeExit") {
                const wrapper: BeforeExitWrapper = (...args) =>
                    listener(...args);
                wrapper.listener = listener;
                beforeExitListeners.push(wrapper);
            }

            return this;
        },
        removeListener,
    } as unknown as NodeJS.Process;

    return {
        beforeExitListeners,
        processRef,
        removeListener,
    };
}

describe("preload beforeExit handler", () => {
    it("tracks once wrappers without mutating them with symbol properties", () => {
        expect.assertions(4);

        const { beforeExitListeners, processRef } = createProcessFixture();

        registerPreloadBeforeExitHandler({
            isDevelopmentMode: () => false,
            preloadLog: vi.fn(),
            processRef,
        });

        const [wrapper] = beforeExitListeners;

        expect(wrapper).toBeTypeOf("function");
        expect(Object.getOwnPropertySymbols(wrapper!)).toStrictEqual([]);
        expect(wrapper).toHaveProperty("listener");
        expect(beforeExitListeners).toHaveLength(1);
    });

    it("prunes stale tracked once wrappers when direct removal misses", () => {
        expect.assertions(4);

        const { beforeExitListeners, processRef, removeListener } =
            createProcessFixture();

        registerPreloadBeforeExitHandler({
            isDevelopmentMode: () => false,
            preloadLog: vi.fn(),
            processRef,
        });

        const [staleWrapper] = beforeExitListeners;
        removeListener.mockImplementationOnce(() => undefined);

        registerPreloadBeforeExitHandler({
            isDevelopmentMode: () => false,
            preloadLog: vi.fn(),
            processRef,
        });

        expect(removeListener).toHaveBeenCalledWith("beforeExit", staleWrapper);
        expect(beforeExitListeners).toHaveLength(1);
        expect(beforeExitListeners[0]).not.toBe(staleWrapper);
        expect(Object.getOwnPropertySymbols(staleWrapper!)).toStrictEqual([]);
    });
});
