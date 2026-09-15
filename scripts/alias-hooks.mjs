/**
 * Resolver hook that teaches plain Node the "@/*" -> "./src/*" path alias from
 * tsconfig.json, so `node --test` can import application modules without a
 * bundler. Used only by `npm test`.
 *
 * Also appends the ".ts" extension that Node's ESM resolver requires but
 * TypeScript source omits.
 */
import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = resolvePath(projectRoot, "src");

const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts"];

function firstExisting(basePath) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = basePath + suffix;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = firstExisting(resolvePath(srcRoot, specifier.slice(2)));
    if (target) {
      return { url: pathToFileURL(target).href, shortCircuit: true };
    }
  }

  // Relative import with no extension, e.g. "./dates".
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const target = firstExisting(resolvePath(parentDir, specifier));
    if (target) {
      return { url: pathToFileURL(target).href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}
