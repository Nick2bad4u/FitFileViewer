import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ["./tests/setupVitest.js"],
        exclude: [
            "libs/**",
            "../libs/**",
            "**/libs/**",
            "**/node_modules/**",
            "node_modules/table/node_modules/json-schema-traverse/spec/index.spec.js",
        ],
    },
});
