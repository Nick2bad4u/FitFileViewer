import { describe, expect, it, vi } from "vitest";

import { exportUtils } from "../../../../../electron-app/utils/files/export/exportUtils.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type GyazoServerResult = {
    message?: string;
    port?: number;
    success: boolean;
};

type GyazoCallbackHandler = (data: unknown) => void;

type TestElectronAPI = {
    onGyazoOAuthCallback: (handler: GyazoCallbackHandler) => () => void;
    startGyazoServer: (port: number) => Promise<GyazoServerResult>;
    stopGyazoServer: () => Promise<void>;
};

function createGyazoApiScope(api: TestElectronAPI): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

function getGlobalRestoreDescriptor(propertyName: string): PropertyDescriptor {
    return (
        Object.getOwnPropertyDescriptor(globalThis, propertyName) ?? {
            configurable: true,
            value: undefined,
            writable: true,
        }
    );
}

function restoreGlobalProperty(
    propertyName: string,
    descriptor: PropertyDescriptor
) {
    Object.defineProperty(globalThis, propertyName, descriptor);
}

describe("exportUtils OAuth state generation", () => {
    it("fails closed before starting the OAuth server when secure randomness is unavailable", async () => {
        expect.assertions(2);

        const cryptoDescriptor = getGlobalRestoreDescriptor("crypto"),
            startGyazoServer = vi.fn<TestElectronAPI["startGyazoServer"]>(),
            electronApiScope = createGyazoApiScope({
                onGyazoOAuthCallback: vi.fn<
                    TestElectronAPI["onGyazoOAuthCallback"]
                >(() => () => {}),
                startGyazoServer,
                stopGyazoServer: vi.fn<TestElectronAPI["stopGyazoServer"]>(),
            });

        try {
            Object.defineProperty(globalThis, "crypto", {
                configurable: true,
                value: undefined,
            });

            await expect(
                exportUtils.authenticateWithGyazo({ electronApiScope })
            ).rejects.toThrow("Secure random number generation is unavailable");
            expect(startGyazoServer).not.toHaveBeenCalled();
        } finally {
            restoreGlobalProperty("crypto", cryptoDescriptor);
        }
    });
});
