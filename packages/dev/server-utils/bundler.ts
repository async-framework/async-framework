import { resolve } from "@std/path";
import * as esbuild from "esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";


// Why: Provides bundling capabilities using Deno's esbuild integration
export function createBundler(rootDir: string) {
  return async (entryPoint: string, options?: esbuild.BuildOptions = {}) => {
    try {
      const absolutePath = resolve(rootDir, entryPoint);

      const result = await esbuild.build({
        bundle: true,
        treeShaking: true,
        // treeShaking: false,
        minify: false,
        define: {
          "import.meta.url": "import_meta_url",
        },
        ...options,
        write: false,
        // jsx: 'automatic',
        jsxFactory: "jsx",
        jsxFragment: "Fragment",
        jsxImportSource: "async-framework",
        // jsxFactory: "Async.createElement",
        // jsxFragment: "Async.Fragment",
        entryPoints: [absolutePath],
        format: "esm",
        plugins: denoPlugins(),
        outfile: "bundle.js",
      });

      // Get the bundled code
      const bundledCode = result.outputFiles[0].text;

      return bundledCode;
    } catch (error) {
      console.error("Bundling error:", error);
      throw error;
    }
  };
}
