import { describe, it, expect } from "vitest";
import { arrayBufferToBase64 } from "../utils/arrayBufferToBase64";

describe("arrayBufferToBase64", () => {
    it("should convert an ArrayBuffer to a base64 string", () => {
        // "hello" in UTF-8
        const str = "hello";
        const buffer = new TextEncoder().encode(str).buffer;
        const base64 = arrayBufferToBase64(buffer);
        // btoa("hello") === "aGVsbG8="
        expect(base64).toBe("aGVsbG8=");
    });
    it("should return an empty string for an empty buffer", () => {
        const buffer = new ArrayBuffer(0);
        const base64 = arrayBufferToBase64(buffer);
        expect(base64).toBe("");
    });
});
