import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setupTabButton } from "../utils/setupTabButton";

describe("setupTabButton", () => {
    let btn;
    beforeEach(() => {
        btn = document.createElement("button");
        btn.id = "tab-btn";
        document.body.appendChild(btn);
    });
    afterEach(() => {
        document.body.removeChild(btn);
    });
    it("should assign the handler to the button onclick", () => {
        const handler = vi.fn();
        setupTabButton("tab-btn", handler);
        btn.click();
        expect(handler).toHaveBeenCalled();
    });
    it("should do nothing if the button does not exist", () => {
        document.body.removeChild(btn);
        expect(() => setupTabButton("tab-btn", vi.fn())).not.toThrow();
    });
});
