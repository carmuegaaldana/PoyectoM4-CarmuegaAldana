import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    // Tests use mocks; do not load the application's credential files.
    envDir: false,
    test: {
        environment: "jsdom",
        include: ["tests/**/*.test.{ts,tsx}"],
        setupFiles: ["./tests/setup.ts"],
        clearMocks: true,
        restoreMocks: true,
        unstubGlobals: true,
    },
});
