import { describe, expect, it, vi } from "vitest";

import { exportUtils } from "../../../../../utils/files/export/exportUtils.js";

type GyazoServerResult = {
    message?: string;
    port?: number;
    success: boolean;
};

type GyazoCallbackHandler = (event: unknown, data: unknown) => void;

type TestElectronAPI = {
    onIpc: (channel: string, handler: GyazoCallbackHandler) => () => void;
    startGyazoServer: (port: number) => Promise<GyazoServerResult>;
    stopGyazoServer: () => Promise<void>;
};

function restoreGlobalProperty(
    propertyName: string,
    descriptor: PropertyDescriptor | undefined
) {
    if (descriptor) {
        Object.defineProperty(globalThis, propertyName, descriptor);
        return;
    }

    Reflect.deleteProperty(globalThis, propertyName);
}

describe("exportUtils OAuth state generation", () => {
    it("fails closed before starting the OAuth server when secure randomness is unavailable", async () => {
        expect.assertions(2);

        const cryptoDescriptor = Object.getOwnPropertyDescriptor(
                globalThis,
                "crypto"
            ),
            electronApiDescriptor = Object.getOwnPropertyDescriptor(
                globalThis,
                "electronAPI"
            ),
            startGyazoServer = vi.fn<
                TestElectronAPI["startGyazoServer"]
            >(),
            testElectronAPI: TestElectronAPI = {
                onIpc: vi.fn<TestElectronAPI["onIpc"]>(() => () => {}),
                startGyazoServer,
                stopGyazoServer: vi.fn<TestElectronAPI["stopGyazoServer"]>(),
            };

        try {
            Object.defineProperty(globalThis, "crypto", {
                configurable: true,
                value: undefined,
            });
            Object.defineProperty(globalThis, "electronAPI", {
                configurable: true,
                value: testElectronAPI,
                writable: true,
            });

            await expect(exportUtils.authenticateWithGyazo()).rejects.toThrow(
                "Secure random number generation is unavailable"
            );
            expect(startGyazoServer).not.toHaveBeenCalled();
        } finally {
            restoreGlobalProperty("crypto", cryptoDescriptor);
            restoreGlobalProperty("electronAPI", electronApiDescriptor);
        }
    });
});
