import * as rollup from "rollup";
import { dirname, fromFileUrl, resolve } from "@std/path";
import typescript from "@rollup/plugin-typescript";
// Import tslib
import tslib from "tslib";

// Helper function for bundling
export function createBundler(root: string) {
  return async (entryPoint: string, name = "bundle") => {
    const absolutePath = resolve(root, entryPoint);
    const directory = dirname(absolutePath);
    const jsPlugin = {
      name: "local-resolver",
      resolveId(source, importer) {
        if (source.startsWith("./") || source.startsWith("../")) {
          if (importer) {
            const importerDir = dirname(importer);
            return resolve(importerDir, source);
          } else {
            return resolve(root, source);
          }
        }
        // Resolve tslib
        if (source === "tslib") {
          return "tslib";
        }
        return null;
      },
      async load(id) {
        // Provide tslib content when requested
        if (id === "tslib") {
          return tslib;
        }
        const filePath = id.startsWith("file://") ? fromFileUrl(id) : id;
        return await Deno.readTextFile(filePath);
      },
    };
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    const tsPlugin = typescript({
      tsconfig: false,
      compilerOptions: {
        target: "es2020",
        module: "esnext",
        moduleResolution: "bundler",
        strict: false,
        // esModuleInterop: true,
        allowImportingTsExtensions: true,
        noEmit: true,
        declaration: false,
        sourceMap: false,
        skipLibCheck: true,
        allowJs: true,
        forceConsistentCasingInFileNames: true,
        lib: ["es2020", "dom"],
      },
      // Specify tslib as an external dependency
      tslib: "tslib",
      include: [
        absolutePath,
        resolve(directory, "**/*.ts"),
        resolve(directory, "**/*.tsx"),
        resolve(directory, "**/*.js"),
        resolve(directory, "**/*.jsx"),
      ],
      // Exclude declaration files
      exclude: [],
    });
    const bundle = await rollup.rollup({
      input: absolutePath,
      plugins: [
        absolutePath.endsWith(".ts") ? tsPlugin : jsPlugin,
      ],
    }).catch((error) => {
      console.error("Error bundling:", directory);
      console.error(error);
      throw error;
    });

    const { output } = await bundle.generate({
      format: "esm",
      name,
    });

    return output[0].code;
  };
}
