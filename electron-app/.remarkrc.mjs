// eslint-disable-next-line n/no-unpublished-import -- Remark loads this local tooling config from devDependencies.
import { createConfig } from "remark-config-nick2bad4u";

/** @type {import("remark-config-nick2bad4u").RemarkConfig} */
const remarkConfig = createConfig({
    plugins: [],
    settings: {},
});

export default remarkConfig;
