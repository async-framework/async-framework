import { resolve, dirname, join, basename } from "@std/path";
import * as esbuild from "esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";
import { parse as parseJsonc } from "@std/jsonc";

interface DenoConfig {
  exports?: Record<string, string>;
  imports?: Record<string, string>;
  name?: string;
  version?: string;
}

// Why: Gets configuration from Deno or Node.js config files and validates exports
export async function getConfigFile(absolutePath: string): Promise<{ 
  hasConfig: boolean; 
  config?: DenoConfig;
  entryPoint?: string;
}> {
  const dirPath = dirname(absolutePath);
  const filename = basename(absolutePath);

  try {
    // Check src directory case
    if (dirPath.endsWith('/src') && /\/packages\//.test(dirPath)) {
      return { hasConfig: true };
    }

    const configFile = await findConfigFile(dirPath);
    if (!configFile) {
      return { hasConfig: false };
    }

    const config = await parseConfigFile(configFile.path);
    if (!config) {
      return { hasConfig: true };
    }

    const entryPoint = findEntryPoint(config, dirPath, filename);
    
    return { 
      hasConfig: true,
      config,
      entryPoint
    };

  } catch {
    return { hasConfig: false };
  }
}

// Why: Finds the configuration file in the given directory
export async function findConfigFile(dirPath: string): Promise<{ path: string; name: string } | null> {
  const CONFIG_FILES = ['deno.json', 'deno.jsonc', 'package.json'];
  
  for await (const entry of Deno.readDir(dirPath)) {
    if (!entry.isFile || !CONFIG_FILES.includes(entry.name)) continue;
    return { 
      path: join(dirPath, entry.name),
      name: entry.name
    };
  }
  
  return null;
}

// Why: Parses the configuration file and returns the config object
async function parseConfigFile(filePath: string): Promise<DenoConfig | null> {
  try {
    const fileContent = await Deno.readTextFile(filePath);
    return filePath.endsWith('jsonc') 
      ? parseJsonc(fileContent) as DenoConfig
      : JSON.parse(fileContent) as DenoConfig;
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

// Why: Finds the entry point from the config exports
export function findEntryPoint(config: DenoConfig, dirPath: string, filename: string): string | undefined {
  if (!config.exports) return undefined;

  const hasExtension = filename.endsWith('.ts') || filename.endsWith('.js');
  const jsFilename = filename + '.js';
  const tsFilename = filename + '.ts';

  for (const [key, value] of Object.entries(config.exports)) {
    if (matchesFilename(key, value, filename, hasExtension, jsFilename, tsFilename)) {
      return join(dirPath, value);
    }
  }

  // Default to "." export if no specific match is found
  if (config.exports["."] && typeof config.exports["."] === "string") {
    return join(dirPath, config.exports["."]);
  }

  return undefined;
}

// Why: Checks if the export key/value matches the filename
export function matchesFilename(
  key: string, 
  value: string, 
  filename: string, 
  hasExtension: boolean,
  jsFilename: string,
  tsFilename: string
): boolean {
  if (hasExtension) {
    return key.endsWith(filename) || value.endsWith(filename);
  }
  
  return key.endsWith(jsFilename) || 
         value.endsWith(jsFilename) || 
         key.endsWith(tsFilename) || 
         value.endsWith(tsFilename);
}

// Why: Provides bundling capabilities using Deno's esbuild integration
export function createBundler(rootDir: string) {
  return async (entryPoint: string, options: esbuild.BuildOptions = {}) => {
    try {
      const absolutePath = resolve(rootDir, entryPoint);
      
      const { hasConfig, config: _config, entryPoint: configEntryPoint } = await getConfigFile(absolutePath);

      // Use the entry point from config if available and no explicit entry point was provided
      const finalEntryPoint = configEntryPoint || absolutePath;

      const result = await esbuild.build({
        bundle: hasConfig,
        treeShaking: false,
        minify: false,
        ...options,
        define: {
          ...options.define,
        },
        write: false,
        jsxFactory: "jsx",
        jsxFragment: "Fragment",
        jsx: "automatic",
        jsxImportSource: "@async/framework",
        entryPoints: [finalEntryPoint],
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
