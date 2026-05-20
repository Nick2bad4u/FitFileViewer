import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadSingleOverlayFile } from "../../../../../utils/files/import/loadSingleOverlayFile.js";

describe("loadSingleOverlayFile - FileReader fallbacks", () => {
    const originalFileReader = (globalThis as any).FileReader;
    const originalResponse = (globalThis as any).Response;
    const originalElectronAPI = (globalThis as any).electronAPI;

    beforeEach(() => {
        // Force Response to be undefined so the code goes to FileReader branch
        (globalThis as any).Response = undefined;
        // Provide a working electronAPI by default; tests can override
        (globalThis as any).electronAPI = {
            decodeFitFile: vi.fn(async () => ({
                recordMesgs: [{ positionLat: 1, positionLong: 2 }],
            })),
        };
    });

    afterEach(() => {
        (globalThis as any).FileReader = originalFileReader;
        (globalThis as any).Response = originalResponse;
        (globalThis as any).electronAPI = originalElectronAPI;
        vi.restoreAllMocks();
    });

    function makeFakeFile(name = "fallback.fit") {
        // Deliberately no arrayBuffer method to force fallback
        return { name } as unknown as File;
    }

    it("uses FileReader fallback and resolves successfully (covers load handler)", async () => {
        class MockFileReader {
            public onerror: ((ev: any) => void) | null = null;
            public result: ArrayBuffer | null = null;
            private loadCb: ((ev: any) => void) | null = null;
            addEventListener(type: string, cb: (ev: any) => void) {
                if (type === "load") this.loadCb = cb;
            }
            readAsArrayBuffer(_file: File) {
                // Simulate async read success and invoke the load event listener
                queueMicrotask(() => {
                    this.result = new ArrayBuffer(8);
                    this.loadCb?.({ target: this });
                });
            }
        }
        (globalThis as any).FileReader = MockFileReader as any;

        const res = await loadSingleOverlayFile(makeFakeFile());
        expect(res.success).toBe(true);
        expect((res.data as any)?.recordMesgs?.length).toBe(1);
        // Ensure decoder was invoked with an ArrayBuffer
        const decode = (globalThis as any).electronAPI
            .decodeFitFile as ReturnType<typeof vi.fn>;
        expect(decode).toHaveBeenCalled();
        const arg = decode.mock.calls[0][0];
        expect(arg).toBeInstanceOf(ArrayBuffer);
    });

    it("propagates FileReader error via catch (covers onerror handler)", async () => {
        class MockFileReader {
            public onerror: ((ev: any) => void) | null = null;
            addEventListener(_type: string, _cb: (ev: any) => void) {
                // not needed for error path
            }
            readAsArrayBuffer(_file: File) {
                // Trigger error path synchronously/asynchronously
                queueMicrotask(() => {
                    this.onerror?.(new Error("Failed to read file"));
                });
            }
        }
        (globalThis as any).FileReader = MockFileReader as any;

        // Decoder won't be reached, but provide it anyway
        (globalThis as any).electronAPI.decodeFitFile = vi.fn();

        const res = await loadSingleOverlayFile(makeFakeFile("bad.fit"));
        expect(res.success).toBe(false);
        expect(typeof res.error).toBe("string");
    });
});
