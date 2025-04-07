import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";
import { db } from "./db";
import { 
  users, projects, timeEntries, monthlyReports,
  User, InsertUser, 
  Project, InsertProject, 
  TimeEntry, InsertTimeEntry, 
  MonthlyReport, InsertMonthlyReport 
} from "@shared/schema";
import { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const results = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return results[0];
  }

  // Project operations
  async getProjects(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const results = await db.select().from(projects).where(eq(projects.id, id));
    return results[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const results = await db.insert(projects).values(project).returning();
    return results[0];
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const results = await db.update(projects).set(projectData).where(eq(projects.id, id)).returning();
    return results[0];
  }

  async deleteProject(id: number): Promise<boolean> {
    const results = await db.delete(projects).where(eq(projects.id, id)).returning();
    return results.length > 0;
  }

  // Time entry operations
  async getTimeEntries(userId: number): Promise<TimeEntry[]> {
    return await db.select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(timeEntries.date);
  }

  async getTimeEntriesByMonth(userId: number, year: number, month: number): Promise<TimeEntry[]> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    return await db.select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          // Use SQL expressions for date comparisons
          sql`${timeEntries.date} >= ${startDate}`,
          sql`${timeEntries.date} <= ${endDate}`
        )
      )
      .orderBy(timeEntries.date);
  }

  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    const results = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return results[0];
  }

  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const results = await db.insert(timeEntries).values(timeEntry).returning();
    return results[0];
  }

  async updateTimeEntry(id: number, timeEntryData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const results = await db.update(timeEntries).set(timeEntryData).where(eq(timeEntries.id, id)).returning();
    return results[0];
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const results = await db.delete(timeEntries).where(eq(timeEntries.id, id)).returning();
    return results.length > 0;
  }

  // Monthly report operations
  async getMonthlyReports(userId: number): Promise<MonthlyReport[]> {
    return await db.select()
      .from(monthlyReports)
      .where(eq(monthlyReports.userId, userId))
      .orderBy(monthlyReports.year, monthlyReports.month);
  }

  async getMonthlyReport(userId: number, year: number, month: number): Promise<MonthlyReport | undefined> {
    const results = await db.select()
      .from(monthlyReports)
      .where(
        and(
          eq(monthlyReports.userId, userId),
          eq(monthlyReports.year, year),
          eq(monthlyReports.month, month)
        )
      );
    return results[0];
  }

  async createMonthlyReport(monthlyReport: InsertMonthlyReport): Promise<MonthlyReport> {
    const results = await db.insert(monthlyReports).values(monthlyReport).returning();
    return results[0];
  }

  async updateMonthlyReport(id: number, reportData: Partial<InsertMonthlyReport>): Promise<MonthlyReport | undefined> {
    const results = await db.update(monthlyReports).set(reportData).where(eq(monthlyReports.id, id)).returning();
    return results[0];
  }
}