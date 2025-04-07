import { 
  users, timeEntries, monthlyReports, 
  type User, type InsertUser, 
  type TimeEntry, type InsertTimeEntry, 
  type MonthlyReport, type InsertMonthlyReport,
  userInitialData
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;

// Create memory store as a fallback
const MemoryStoreSession = MemoryStore(session);

// Create PostgreSQL pool with more robust connection handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Limit maximum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Connection timeout
});

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session storage
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Time entry methods
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getTimeEntriesByUser(userId: number): Promise<TimeEntry[]>;
  getTimeEntriesByUserAndMonth(userId: number, year: number, month: number): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;
  
  // Monthly report methods
  getMonthlyReport(id: number): Promise<MonthlyReport | undefined>;
  getMonthlyReportByUserAndMonth(userId: number, year: number, month: number): Promise<MonthlyReport | undefined>;
  getMonthlyReportsByUser(userId: number): Promise<MonthlyReport[]>;
  createMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport>;
  updateMonthlyReport(id: number, report: Partial<InsertMonthlyReport>): Promise<MonthlyReport | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    try {
      // Try to use PostgreSQL for session storage
      this.sessionStore = new PostgresSessionStore({
        pool,
        createTableIfMissing: true,
        tableName: 'session', // Be explicit about table name
        ttl: 86400000, // 1 day in milliseconds
        errorLog: console.error
      });
      console.log("Successfully initialized PostgreSQL session store");
    } catch (error) {
      // Fall back to memory store if PostgreSQL session store fails
      console.error("Failed to initialize PostgreSQL session store, using memory store instead:", error);
      this.sessionStore = new MemoryStoreSession({
        checkPeriod: 86400000 // 1 day cleanup period
      });
    }
  }
  
  async initializeDefaultUser(): Promise<void> {
    const existingUser = await this.getUserByUsername(userInitialData.username);
    if (!existingUser) {
      await this.createUser(userInitialData);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
      
    return result[0];
  }

  // Time entry methods
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    const result = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return result[0];
  }

  async getTimeEntriesByUser(userId: number): Promise<TimeEntry[]> {
    return db.select().from(timeEntries).where(eq(timeEntries.userId, userId));
  }

  async getTimeEntriesByUserAndMonth(userId: number, year: number, month: number): Promise<TimeEntry[]> {
    // Отримуємо всі записи користувача
    const entries = await db.select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(timeEntries.date);
    
    // Фільтруємо записи в коді, оскільки дати зберігаються як рядки ISO
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month - 1;
    });
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const result = await db.insert(timeEntries).values(entry).returning();
    return result[0];
  }

  async updateTimeEntry(id: number, entryData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const result = await db.update(timeEntries)
      .set(entryData)
      .where(eq(timeEntries.id, id))
      .returning();
      
    return result[0];
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const result = await db.delete(timeEntries)
      .where(eq(timeEntries.id, id))
      .returning({ id: timeEntries.id });
      
    return result.length > 0;
  }

  // Monthly report methods
  async getMonthlyReport(id: number): Promise<MonthlyReport | undefined> {
    const result = await db.select().from(monthlyReports).where(eq(monthlyReports.id, id));
    return result[0];
  }

  async getMonthlyReportByUserAndMonth(userId: number, year: number, month: number): Promise<MonthlyReport | undefined> {
    const result = await db.select()
      .from(monthlyReports)
      .where(
        and(
          eq(monthlyReports.userId, userId),
          eq(monthlyReports.year, year),
          eq(monthlyReports.month, month)
        )
      );
      
    return result[0];
  }

  async getMonthlyReportsByUser(userId: number): Promise<MonthlyReport[]> {
    return db.select()
      .from(monthlyReports)
      .where(eq(monthlyReports.userId, userId))
      .orderBy(desc(monthlyReports.year), desc(monthlyReports.month));
  }

  async createMonthlyReport(report: InsertMonthlyReport): Promise<MonthlyReport> {
    const result = await db.insert(monthlyReports).values(report).returning();
    return result[0];
  }

  async updateMonthlyReport(id: number, reportData: Partial<InsertMonthlyReport>): Promise<MonthlyReport | undefined> {
    const result = await db.update(monthlyReports)
      .set(reportData)
      .where(eq(monthlyReports.id, id))
      .returning();
      
    return result[0];
  }
}

// Initialize database storage
export const storage = new DatabaseStorage();

// Create default user if no users exist
storage.initializeDefaultUser().catch(console.error);
