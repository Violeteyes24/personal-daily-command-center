// Registers the "@/*" alias resolver for `node --test`. See alias-hooks.mjs.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-hooks.mjs", pathToFileURL(import.meta.filename));
