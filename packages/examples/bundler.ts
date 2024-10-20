import * as rollup from "rollup";
import { dirname, fromFileUrl, resolve } from "@std/path";

// Helper function for bundling
export function createBundler(root: string) {
  return async (entryPoint: string, name = "bundle") => {
    const absolutePath = resolve(root, entryPoint);
    const bundle = await rollup.rollup({
      input: absolutePath,
      plugins: [{
        name: "local-resolver",
        resolveId(source, importer) {
          if (source.startsWith("./") || source.startsWith("../")) {
            if (importer) {
              // Use dirname to get the directory of the importer
              const importerDir = dirname(importer);
              return resolve(importerDir, source);
            } else {
              // If there's no importer, join with the root directory
              return resolve(root, source);
            }
          }
          return null; // Return null for other cases to let Rollup handle them
        },
        async load(id) {
          // Convert file:// URLs to paths if necessary
          const filePath = id.startsWith("file://") ? fromFileUrl(id) : id;
          return await Deno.readTextFile(filePath);
        },
      }],
    });
  
    const { output } = await bundle.generate({
      format: "module",
      name,
    });
  
    return output[0].code;
  }

}
