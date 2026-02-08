// Root ESLint flat config proxy.
//
// This delegates to the electron-app config but sets the base path at the repo
// root so sibling packages (like docusaurus) can be linted without the
// "outside of base path" warnings.

import config from "./electron-app/eslint.config.mjs";

export default config;
