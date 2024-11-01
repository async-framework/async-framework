import { assertEquals } from "@std/assert";
import { join, dirname } from "@std/path";
import { getConfigFile } from "./bundler.ts";

// Setup test directory structure
async function setupTestDir(structure: Record<string, string>) {
  const testDir = await Deno.makeTempDir();

  for (const [path, content] of Object.entries(structure)) {
    const fullPath = join(testDir, path);
    await Deno.mkdir(dirname(fullPath), { recursive: true });
    await Deno.writeTextFile(fullPath, content);
  }

  return testDir;
}

Deno.test("getConfigFile - async-framework style package", async () => {
  const testDir = await setupTestDir({
    "deno.jsonc": `{
      "name": "@test/framework",
      "version": "0.0.1",
      "imports": {
        "#/": "./"
      },
      "exports": {
        ".": "./index.ts",
        "./jsx-runtime": "./jsx-runtime.ts"
      }
    }`,
  });

  const result = await getConfigFile(testDir);
  assertEquals(result.hasConfig, true);
  assertEquals(result.config?.exports?.["."], "./index.ts");
  assertEquals(result.config?.exports?.["./jsx-runtime"], "./jsx-runtime.ts");
  assertEquals(result.entryPoint, join(testDir, "index.ts"));

  await Deno.remove(testDir, { recursive: true });
});

Deno.test("getConfigFile - src directory package", async () => {
  const testDir = await setupTestDir({
    "packages/my-package/src/dummy.ts": "",
  });

  const result = await getConfigFile(join(testDir, "packages/my-package/src"));
  assertEquals(result.hasConfig, true);
  assertEquals(result.config, undefined);
  assertEquals(result.entryPoint, undefined);

  await Deno.remove(testDir, { recursive: true });
});

Deno.test("getConfigFile - package.json style package", async () => {
  const testDir = await setupTestDir({
    "package.json": `{
      "name": "test-package",
      "version": "1.0.0",
      "exports": {
        ".": "./dist/index.js"
      }
    }`,
  });

  const result = await getConfigFile(testDir);
  assertEquals(result.hasConfig, true);
  assertEquals(result.config?.exports?.["."], "./dist/index.js");
  assertEquals(result.entryPoint, join(testDir, "dist/index.js"));

  await Deno.remove(testDir, { recursive: true });
});

Deno.test("getConfigFile - invalid config file", async () => {
  const testDir = await setupTestDir({
    "deno.jsonc": `{ "name": "invalid-json" `,  // Intentionally invalid JSON
  });

  const result = await getConfigFile(testDir);
  assertEquals(result.hasConfig, true);
  assertEquals(result.config, undefined);
  assertEquals(result.entryPoint, undefined);

  await Deno.remove(testDir, { recursive: true });
});

Deno.test("getConfigFile - no config file", async () => {
  const testDir = await setupTestDir({
    "src/index.ts": "",
  });

  const result = await getConfigFile(testDir);
  assertEquals(result.hasConfig, false);
  assertEquals(result.config, undefined);
  assertEquals(result.entryPoint, undefined);

  await Deno.remove(testDir, { recursive: true });
});

Deno.test("getConfigFile - multiple export formats", async () => {
  const testDir = await setupTestDir({
    "deno.jsonc": `{
      "name": "@test/package",
      "exports": {
        ".": "./src/index.ts",
        "./utils": "./src/utils/index.ts",
        "./components/*": "./src/components/*"
      }
    }`,
  });

  const result = await getConfigFile(testDir);
  assertEquals(result.hasConfig, true);
  assertEquals(result.config?.exports?.["."], "./src/index.ts");
  assertEquals(result.config?.exports?.["./utils"], "./src/utils/index.ts");
  assertEquals(result.entryPoint, join(testDir, "src/index.ts"));

  await Deno.remove(testDir, { recursive: true });
});
