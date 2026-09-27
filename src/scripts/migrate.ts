import { createRequire } from "node:module";
import { auth } from "../lib/auth";

const require = createRequire(import.meta.url);
const { getMigrations } = require(
  require.resolve("better-auth").replace(/dist[/\\]index\.mjs$/, "dist/db/get-migration.mjs")
);

async function main() {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  console.log("Migrations complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
