import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/lib/tsc.js");

const projects = [
  "tsconfig.json",
  "apps/api/tsconfig.json",
  "apps/web/tsconfig.json",
  "packages/shared/tsconfig.json",
];

for (const project of projects) {
  try {
    execFileSync(
      process.execPath,
      [tscPath, "-p", project, "--showConfig", "--pretty", "false"],
      { stdio: ["ignore", "pipe", "inherit"] },
    );
  } catch (error) {
    if (error.stdout) {
      process.stdout.write(error.stdout);
    }
    throw error;
  }
  console.log(`${project}: configuration ok`);
}
