import { runEslintTarget } from "./run-eslint.mjs";

process.exitCode = runEslintTarget("docusaurus", process.argv.slice(2));
