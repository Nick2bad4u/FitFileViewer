export function buildIdVariants(id: string): string[];

export function getElementByIdFlexible(
    doc: Document | null | undefined,
    id: string
): HTMLElement | null;

export function querySelectorByIdFlexible(
    doc: Document | null | undefined,
    selector: string
): HTMLElement | null;
