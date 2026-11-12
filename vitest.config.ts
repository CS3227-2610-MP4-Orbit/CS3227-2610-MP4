import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Match the "@/..." import alias from tsconfig.json, so components using it can be tested.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
