import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { showAboutModal } from "../utils/aboutModal";

// Re-import the function under test
// Since ensureAboutModal is not exported, we need to import showAboutModal to trigger it

describe("ensureAboutModal", () => {
    beforeEach(() => {
        // Clean up any existing modal before each test
        const existing = document.getElementById("about-modal");
        if (existing) existing.remove();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        // Clean up after each test
        const existing = document.getElementById("about-modal");
        if (existing) existing.remove();
        document.body.innerHTML = "";
    });

    it("should create the about modal if it does not exist", () => {
        expect(document.getElementById("about-modal")).toBeNull();
        showAboutModal("Test HTML");
        const modal = document.getElementById("about-modal");
        expect(modal).not.toBeNull();
        expect(modal.className).toBe("modal");
        expect(modal.style.display).toBe("flex");
        expect(modal.querySelector("#about-modal-close")).not.toBeNull();
        expect(modal.querySelector("#about-modal-body")).not.toBeNull();
    });

    it("should not create a second modal if one already exists", () => {
        showAboutModal("First");
        const firstModal = document.getElementById("about-modal");
        showAboutModal("Second");
        const modals = document.querySelectorAll("#about-modal");
        expect(modals.length).toBe(1);
        expect(document.getElementById("about-modal")).toBe(firstModal);
    });
});

describe("showAboutModal", () => {
    beforeEach(() => {
        // Clean up any existing modal
        const existing = document.getElementById("about-modal");
        if (existing) existing.remove();
    });

    it("should create and show the about modal with provided HTML", () => {
        showAboutModal("<b>Test</b>");
        const modal = document.getElementById("about-modal");
        expect(modal).not.toBeNull();
        expect(modal.style.display).toBe("flex");
        const body = document.getElementById("about-modal-body");
        expect(body.innerHTML).toBe("<b>Test</b>");
    });

    it("should close the modal when close button is clicked", () => {
        showAboutModal("Test");
        const modal = document.getElementById("about-modal");
        const closeBtn = document.getElementById("about-modal-close");
        closeBtn.click();
        expect(modal.style.display).toBe("none");
    });

    it("should close the modal when close button is activated by keyboard", () => {
        showAboutModal("Test");
        const modal = document.getElementById("about-modal");
        const closeBtn = document.getElementById("about-modal-close");
        closeBtn.onkeydown({ key: "Enter" });
        expect(modal.style.display).toBe("none");
        showAboutModal("Test");
        closeBtn.onkeydown({ key: " " });
        expect(modal.style.display).toBe("none");
    });

    it("should close the modal when clicking outside modal content", () => {
        showAboutModal("Test");
        const modal = document.getElementById("about-modal");
        modal.onclick({ target: modal });
        expect(modal.style.display).toBe("none");
    });
});
