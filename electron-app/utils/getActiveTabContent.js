export function getActiveTabContent() {
    const tabContents = document.querySelectorAll(".tab-content");
    for (const el of tabContents) {
        if (el.style.display === "block") return el;
    }
    return null;
}
