import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setActiveTab } from "../utils/setActiveTab";

describe("setActiveTab", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const btn1 = document.createElement("button");
        btn1.className = "tab-button active";
        btn1.id = "tab1";
        const btn2 = document.createElement("button");
        btn2.className = "tab-button";
        btn2.id = "tab2";
        document.body.appendChild(btn1);
        document.body.appendChild(btn2);
    });
    it("should add active class to the specified tab and remove from others", () => {
        setActiveTab("tab2");
        expect(document.getElementById("tab1").classList.contains("active")).toBe(false);
        expect(document.getElementById("tab2").classList.contains("active")).toBe(true);
    });
    it("should do nothing if the tab does not exist", () => {
        setActiveTab("nonexistent");
        expect(document.getElementById("tab1").classList.contains("active")).toBe(false);
        expect(document.getElementById("tab2").classList.contains("active")).toBe(false);
    });
});
