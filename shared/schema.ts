import { pgTable, text, serial, integer, timestamp, boolean, primaryKey, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  position: text("position"),
  profileImage: text("profile_image"),
  workHoursPerDay: integer("work_hours_per_day").notNull().default(8),
  breakMinutes: integer("break_minutes").notNull().default(60),
  autoBreak: boolean("auto_break").notNull().default(true),
  workDays: text("work_days").notNull().default("1,2,3,4,5"), // Comma-separated list of day numbers (1=Monday, 7=Sunday)
});

export const usersRelations = relations(users, ({ many }) => ({
  timeEntries: many(timeEntries),
  monthlyReports: many(monthlyReports),
}));

export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  // Удаляем поля, связанные с перерывом
  // breakStartTime: text("break_start_time"),
  // breakEndTime: text("break_end_time"),
  // hasBreak: boolean("has_break").notNull().default(false),
  hourlyRate: integer("hourly_rate").notNull().default(0), // Добавляем ставку в чешских кронах (CZK)
  notes: text("notes"),
});

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id]
  }),
}));

export const monthlyReports = pgTable("monthly_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  workDays: integer("work_days").notNull(),
  workedMinutes: integer("worked_minutes").notNull(),
  targetMinutes: integer("target_minutes").notNull(),
  overtimeMinutes: integer("overtime_minutes").notNull(),
  vacationDays: integer("vacation_days").notNull().default(0),
  carriedFromMinutes: integer("carried_from_minutes").notNull().default(0),
  carriedToMinutes: integer("carried_to_minutes").notNull().default(0),
});

export const monthlyReportsRelations = relations(monthlyReports, ({ one }) => ({
  user: one(users, {
    fields: [monthlyReports.userId],
    references: [users.id]
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
// Создаем схему для проверки данных и изменяем правила для поля date
export const insertTimeEntrySchema = createInsertSchema(timeEntries)
  .omit({ id: true })
  .extend({
    // Если date приходит как строка, преобразуем ее в объект Date
    date: z.union([
      z.string().transform((val) => new Date(val)),
      z.date()
    ])
  });
export const insertMonthlyReportSchema = createInsertSchema(monthlyReports).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;

export type User = typeof users.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type MonthlyReport = typeof monthlyReports.$inferSelect;

export const userInitialData: InsertUser = {
  username: "user",
  password: "password",
  fullName: "Олександр Коваленко",
  email: "oleksandr@example.com",
  phone: "+380 12 345 6789",
  position: "Розробник",
  workHoursPerDay: 8,
  breakMinutes: 60,
  autoBreak: true,
  workDays: "1,2,3,4,5",
};
