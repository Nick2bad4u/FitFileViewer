// generate-prettier-sarif.js
// Usage: node generate-prettier-sarif.js prettier-output.txt prettier-results.sarif

const fs = require("fs");

if (process.argv.length < 4) {
    console.error("Usage: node generate-prettier-sarif.js <prettier-output.txt> <prettier-results.sarif>");
    process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

const output = fs.readFileSync(inputFile, "utf8");
const lines = output.split("\n");

const results = [];
const filePattern = /^([^ ]+\.[^ ]+).*$/;

for (const line of lines) {
    if (line.includes("Code style issues found")) break;
    const match = filePattern.exec(line.trim());
    if (match) {
        results.push({
            file: match[1],
        });
    }
}

const sarif = {
    version: "2.1.0",
    $schema: "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0-rtm.5.json",
    runs: [
        {
            tool: {
                driver: {
                    name: "Prettier",
                    informationUri: "https://prettier.io/",
                    rules: [
                        {
                            id: "prettier-format",
                            name: "Prettier Format",
                            shortDescription: {
                                text: "File is not formatted according to Prettier.",
                            },
                            helpUri: "https://prettier.io/",
                        },
                    ],
                },
            },
            results: results.map((r) => ({
                ruleId: "prettier-format",
                message: { text: "File is not formatted according to Prettier." },
                locations: [
                    {
                        physicalLocation: {
                            artifactLocation: {
                                uri: r.file.replace(/\\/g, "/"),
                            },
                        },
                    },
                ],
                level: "warning",
            })),
        },
    ],
};

fs.writeFileSync(outputFile, JSON.stringify(sarif, null, 2));
console.log(`SARIF file written to ${outputFile}`);
