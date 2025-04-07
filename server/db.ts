import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { timeEntries, users, monthlyReports } from "@shared/schema";

// Initialize database client with more robust connection handling
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  max: 10, // Maximum concurrent connections
  idle_timeout: 30, // 30 seconds
  connect_timeout: 10, // 10 seconds
  max_lifetime: 60 * 30, // 30 minutes
  debug: (conn, query, params, types) => {
    // For debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('SQL Query:', query);
    }
  }
});

// The postgres-js library handles errors internally
// We'll add error handling at the application level instead

console.log('Initializing database connection...');
// Export the drizzle instance
export const db = drizzle(client);