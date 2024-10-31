import { resolve, dirname, join } from "@std/path";
import * as esbuild from "esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";

// Why: Checks if a directory contains Deno or Node.js configuration files
async function hasConfigFile(dirPath: string): Promise<boolean> {
  try {
    // entry point
    console.log('dirPath', dirPath);
    if (dirPath.endsWith('/src') && /\/packages\//.test(dirPath)) {
      return true;
    }
    const dir = await Deno.readDir(dirPath);
    for await (const entry of dir) {
      if (entry.isFile && [
        'deno.json',
        'deno.jsonc',
        'package.json',
      ].includes(entry.name)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// Why: Provides bundling capabilities using Deno's esbuild integration
export function createBundler(rootDir: string) {
  return async (entryPoint: string, options: esbuild.BuildOptions = {}) => {
    try {
      const absolutePath = resolve(rootDir, entryPoint);
      const dirPath = dirname(absolutePath);
      
      const shouldBundle = await hasConfigFile(dirPath);

      const result = await esbuild.build({
        bundle: shouldBundle,
        treeShaking: false,
        minify: false,
        ...options,
        define: {
          ...options.define,
          "import.meta.url": "import_meta_url",
        },
        write: false,
        jsxFactory: "jsx",
        jsxFragment: "Fragment",
        jsxImportSource: "async-framework",
        entryPoints: [absolutePath],
        format: "esm",
        plugins: [
          {
            name: 'extension-resolver',
            setup(build): void {
              build.onResolve({ filter: /.*/ }, async (args) => {
                if (args.path.startsWith('http://') || args.path.startsWith('https://')) {
                  return { external: true, path: args.path };
                }

                // Handle relative imports
                if (args.path.startsWith('.')) {
                  const resolvedDir = args.resolveDir || dirname(args.importer);
                  const possibleExtensions = ['.ts', '.js', '.tsx', '.jsx', '/index.ts', '/index.js'];
                  
                  for (const ext of possibleExtensions) {
                    try {
                      const fullPath = join(resolvedDir, args.path + ext);
                      await Deno.stat(fullPath);
                      return { path: fullPath };
                    } catch {
                      continue;
                    }
                  }
                }

                // Let other plugins handle the resolution if we couldn't resolve it
                return null;
              });
            },
          },
          ...denoPlugins(),
        ],
        outfile: "bundle.js",
      });

      const bundledCode = result.outputFiles[0].text;
      return bundledCode;
    } catch (error) {
      console.error("Bundling error:", error);
      throw error;
    }
  };
}
