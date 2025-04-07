import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTimeEntrySchema, insertMonthlyReportSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { hashPassword, comparePasswords } from "./auth";

const monthParamsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // User routes - this endpoint is already implemented by setupAuth
  // app.get("/api/user") 

  app.patch("/api/user", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = req.user!.id;
    const updatedUser = await storage.updateUser(userId, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: "Failed to update user" });
    }
    
    // Обновляем пользователя в сессии
    req.login(updatedUser, (err) => {
      if (err) return res.status(500).json({ message: "Failed to update session" });
      return res.json(updatedUser);
    });
  });
  
  // Change password route
  app.patch("/api/user/password", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Get current user
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user with new password
      const updatedUser = await storage.updateUser(req.user!.id, {
        password: hashedPassword
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ message: `Error changing password: ${error}` });
    }
  });

  // Time entries routes
  app.get("/api/time-entries", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const entries = await storage.getTimeEntriesByUser(req.user!.id);
    return res.json(entries);
  });
  
  app.get("/api/time-entries/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { id } = idParamSchema.parse(req.params);
      
      const entry = await storage.getTimeEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      // Проверка принадлежности записи текущему пользователю
      if (entry.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      return res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/time-entries/:year/:month", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { year, month } = monthParamsSchema.parse(req.params);
      const entries = await storage.getTimeEntriesByUserAndMonth(req.user!.id, year, month);
      return res.json(entries);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/time-entries", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log('Received time entry data:', req.body);
      
      // Валидируем и преобразуем данные с помощью Zod
      const entryData = insertTimeEntrySchema.parse({
        ...req.body,
        userId: req.user!.id // Устанавливаем userId текущего пользователя
      });
      console.log('Processed time entry data after validation:', entryData);
      
      const entry = await storage.createTimeEntry(entryData);
      console.log('Created entry:', entry);
      
      return res.status(201).json(entry);
    } catch (error) {
      console.error('Error processing time entry:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/time-entries/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { id } = idParamSchema.parse(req.params);
      
      // Проверка принадлежности записи текущему пользователю
      const entry = await storage.getTimeEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      if (entry.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      console.log('Received update data:', req.body);
      
      // Создаем схему для обновления, которая является частичной версией схемы создания
      const updateTimeEntrySchema = insertTimeEntrySchema.partial();
      
      // Валидируем и преобразуем данные с помощью Zod
      const entryData = updateTimeEntrySchema.parse({
        ...req.body,
        userId: req.user!.id // Убедимся, что userId не изменяется
      });
      
      console.log('Processed update data after validation:', entryData);
      
      const updatedEntry = await storage.updateTimeEntry(id, entryData);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      console.log('Updated entry:', updatedEntry);
      
      return res.json(updatedEntry);
    } catch (error) {
      console.error('Error updating time entry:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/time-entries/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { id } = idParamSchema.parse(req.params);
      
      // Проверка принадлежности записи текущему пользователю
      const entry = await storage.getTimeEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      if (entry.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteTimeEntry(id);
      if (!success) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Monthly reports routes
  app.get("/api/monthly-reports", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const reports = await storage.getMonthlyReportsByUser(req.user!.id);
    return res.json(reports);
  });

  app.get("/api/monthly-reports/:year/:month", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { year, month } = monthParamsSchema.parse(req.params);
      const userId = req.user!.id;
      
      let report = await storage.getMonthlyReportByUserAndMonth(userId, year, month);
      
      // Получаем все записи за месяц для расчета отработанных часов
      const entries = await storage.getTimeEntriesByUserAndMonth(userId, year, month);
      
      // Рассчитываем общее количество отработанных минут
      const totalWorkedMinutes = entries.reduce((total, entry) => {
        const [startHours, startMinutes] = entry.startTime.split(':').map(Number);
        const [endHours, endMinutes] = entry.endTime.split(':').map(Number);
        
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;
        
        return total + (endTotalMinutes - startTotalMinutes);
      }, 0);
      
      if (!report) {
        // If no report exists, create one with default values
        const workDays = 22; // This should be calculated based on the month
        const targetMinutes = workDays * req.user!.workHoursPerDay * 60;
        
        const newReport = await storage.createMonthlyReport({
          userId,
          year,
          month,
          workDays,
          workedMinutes: totalWorkedMinutes,
          targetMinutes,
          overtimeMinutes: totalWorkedMinutes - targetMinutes,
          vacationDays: 0,
          carriedFromMinutes: 0,
          carriedToMinutes: 0,
        });
        
        return res.json(newReport);
      }
      
      // Обновляем отчет с актуальными данными по отработанным часам
      if (report.workedMinutes !== totalWorkedMinutes) {
        const updatedReport = await storage.updateMonthlyReport(report.id, {
          workedMinutes: totalWorkedMinutes,
          overtimeMinutes: totalWorkedMinutes - report.targetMinutes
        });
        return res.json(updatedReport);
      }
      
      return res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/monthly-reports", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const reportData = insertMonthlyReportSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const report = await storage.createMonthlyReport(reportData);
      return res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/monthly-reports/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { id } = idParamSchema.parse(req.params);
      
      // Проверка принадлежности отчета текущему пользователю
      const report = await storage.getMonthlyReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      if (report.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedReport = await storage.updateMonthlyReport(id, req.body);
      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      return res.json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Return the server
  const httpServer = createServer(app);
  return httpServer;
}
