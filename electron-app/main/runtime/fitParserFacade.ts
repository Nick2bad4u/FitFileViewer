import * as fitParserExports from "../../fitParser.js";

type FitParserModule = import("../../shared/fitParser").FitParserModule;

const fitParserModule = fitParserExports as unknown as FitParserModule;

export function getFitParserModule(): FitParserModule {
    return fitParserModule;
}
