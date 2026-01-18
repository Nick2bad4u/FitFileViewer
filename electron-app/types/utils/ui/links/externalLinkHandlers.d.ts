/**
 * Wires click/keyboard activation for links marked with `data-external-link` within a root.
 *
 * This is designed to be called for modal roots (not the entire document) to keep event scope
 * predictable and avoid interfering with OAuth flows or internal links.
 *
 * @param {Object} params
 * @param {ParentNode} params.root
 * @param {(url: string, error: Error) => void} [params.onOpenExternalError]
 * @returns {() => void} cleanup
 */
export function attachExternalLinkHandlers({
    root,
    onOpenExternalError,
}: {
    root: ParentNode;
    onOpenExternalError?: (url: string, error: Error) => void;
}): () => void;
