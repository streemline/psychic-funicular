import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// For migrations
const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });

async function runMigration() {
  const db = drizzle(migrationClient);
  
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations completed!");
  
  await migrationClient.end();
}

runMigration().catch(e => {
  console.error("Migration failed:", e);
  process.exit(1);
});