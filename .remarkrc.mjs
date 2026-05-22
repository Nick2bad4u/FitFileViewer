import { createConfig } from "remark-config-nick2bad4u";
import remarkLintCheckTOC from "remark-lint-check-toc";

/** @type {import("remark-config-nick2bad4u").RemarkConfig} */
const remarkConfig = createConfig({
    plugins: [
        // The shared preset generates TOCs to depth 2 but checks every heading.
        // Keep link validation active and avoid forcing huge generated TOCs.
        [remarkLintCheckTOC, false],
    ],
    settings: {},
});

export default remarkConfig;
