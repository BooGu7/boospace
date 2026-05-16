import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * SSR + Vercel adapter writes prerendered HTML under `dist/client/`.
 * Pure static builds use `dist/`.
 */
const site = existsSync("dist/client") ? "dist/client" : "dist";
execSync(`pagefind --site ${site}`, { stdio: "inherit" });
