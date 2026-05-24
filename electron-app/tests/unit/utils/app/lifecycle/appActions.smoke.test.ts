/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";

describe("appActions smoke", () => {
    it("runs basic assertion", () => {
        expect(1 + 1).toBe(2);
        expect(1 + 1).not.toBe(3);
    });
});
