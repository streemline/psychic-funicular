import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { timeEntries, users, monthlyReports } from "@shared/schema";

// Initialize database client
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);