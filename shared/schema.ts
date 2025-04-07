import { pgTable, text, serial, integer, timestamp, date, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("25"),
  monthlyGoalHours: decimal("monthly_goal_hours", { precision: 10, scale: 2 }).default("160"),
  initials: text("initials"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  duration: decimal("duration", { precision: 10, scale: 2 }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
});

// Monthly reports table
export const monthlyReports = pgTable("monthly_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  hoursWorked: decimal("hours_worked", { precision: 10, scale: 2 }).notNull(),
  daysWorked: integer("days_worked").notNull(),
  dailyAverage: decimal("daily_average", { precision: 10, scale: 2 }).notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const insertMonthlyReportSchema = createInsertSchema(monthlyReports).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;
