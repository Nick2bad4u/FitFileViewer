import { runEslintTarget } from "./run-eslint.mjs";

process.exitCode = runEslintTarget("root", process.argv.slice(2));
