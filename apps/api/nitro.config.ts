import { defineConfig } from "nitro";

export default defineConfig({
    modules: ["workflow/nitro"],
    // Route ALL requests to the Hono app (per useworkflow.dev Hono guide)
    routes: {
        "/**": "./src/index.ts",
    },
    // Ensure we use the correct node runtime
    preset: "node-server",
});
