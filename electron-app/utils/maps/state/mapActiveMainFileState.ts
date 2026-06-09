let activeMainFileIndex: number | null = null;

export function getActiveMainMapFileIndex(): number | null {
    return activeMainFileIndex;
}

export function resetActiveMainMapFileIndexForTests(): void {
    setActiveMainMapFileIndex(null);
}

export function setActiveMainMapFileIndex(index: number | null): void {
    activeMainFileIndex = Number.isFinite(index) ? index : null;
}
