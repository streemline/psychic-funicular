import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTimeEntrySchema, insertProjectSchema, insertMonthlyReportSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/user", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't return the password
    const { password, ...userData } = user;
    res.json(userData);
  });

  app.patch("/api/user", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    
    try {
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userData } = updatedUser;
      res.json(userData);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    
    const projects = await storage.getProjects(userId);
    res.json(projects);
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    
    try {
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId
      });
      
      const newProject = await storage.createProject(projectData);
      res.status(201).json(newProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(project);
  });

  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    try {
      const updatedProject = await storage.updateProject(projectId, req.body);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(updatedProject);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    const success = await storage.deleteProject(projectId);
    if (!success) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.status(204).end();
  });

  // Time entries routes
  app.get("/api/time-entries", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    
    const timeEntries = await storage.getTimeEntries(userId);
    res.json(timeEntries);
  });

  app.get("/api/time-entries/:year/:month", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    const entries = await storage.getTimeEntriesByMonth(userId, year, month);
    res.json(entries);
  });

  app.post("/api/time-entries", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    
    try {
      // Calculate duration and earnings
      const startTime = req.body.startTime;
      const endTime = req.body.endTime;
      const hourlyRate = parseFloat(req.body.hourlyRate);
      
      // Parse times to calculate duration
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      let durationHours = endHours - startHours;
      let durationMinutes = endMinutes - startMinutes;
      
      if (durationMinutes < 0) {
        durationHours--;
        durationMinutes += 60;
      }
      
      const duration = durationHours + (durationMinutes / 60);
      const earnings = duration * hourlyRate;
      
      const timeEntryData = insertTimeEntrySchema.parse({
        ...req.body,
        userId,
        duration: duration.toFixed(2),
        earnings: earnings.toFixed(2)
      });
      
      const newTimeEntry = await storage.createTimeEntry(timeEntryData);
      res.status(201).json(newTimeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.get("/api/time-entries/:id", async (req: Request, res: Response) => {
    const entryId = parseInt(req.params.id);
    
    const entry = await storage.getTimeEntry(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Time entry not found" });
    }
    
    res.json(entry);
  });

  app.patch("/api/time-entries/:id", async (req: Request, res: Response) => {
    const entryId = parseInt(req.params.id);
    
    try {
      // If time fields were updated, recalculate duration and earnings
      if (req.body.startTime || req.body.endTime || req.body.hourlyRate) {
        const entry = await storage.getTimeEntry(entryId);
        if (!entry) {
          return res.status(404).json({ message: "Time entry not found" });
        }
        
        const startTime = req.body.startTime || entry.startTime;
        const endTime = req.body.endTime || entry.endTime;
        const hourlyRate = parseFloat(req.body.hourlyRate || entry.hourlyRate.toString());
        
        // Parse times to calculate duration
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        const [endHours, endMinutes] = endTime.split(":").map(Number);
        
        let durationHours = endHours - startHours;
        let durationMinutes = endMinutes - startMinutes;
        
        if (durationMinutes < 0) {
          durationHours--;
          durationMinutes += 60;
        }
        
        const duration = durationHours + (durationMinutes / 60);
        const earnings = duration * hourlyRate;
        
        req.body.duration = duration.toFixed(2);
        req.body.earnings = earnings.toFixed(2);
      }
      
      const updatedEntry = await storage.updateTimeEntry(entryId, req.body);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/time-entries/:id", async (req: Request, res: Response) => {
    const entryId = parseInt(req.params.id);
    
    const success = await storage.deleteTimeEntry(entryId);
    if (!success) {
      return res.status(404).json({ message: "Time entry not found" });
    }
    
    res.status(204).end();
  });

  // Monthly reports routes
  app.get("/api/monthly-reports", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    
    const reports = await storage.getMonthlyReports(userId);
    res.json(reports);
  });

  app.get("/api/monthly-reports/:year/:month", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    const report = await storage.getMonthlyReport(userId, year, month);
    if (!report) {
      return res.status(404).json({ message: "Monthly report not found" });
    }
    
    res.json(report);
  });

  app.post("/api/monthly-reports", async (req: Request, res: Response) => {
    const userId = 1; // In a real app, would get from session
    
    try {
      const reportData = insertMonthlyReportSchema.parse({
        ...req.body,
        userId
      });
      
      const newReport = await storage.createMonthlyReport(reportData);
      res.status(201).json(newReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/monthly-reports/:id", async (req: Request, res: Response) => {
    const reportId = parseInt(req.params.id);
    
    try {
      const updatedReport = await storage.updateMonthlyReport(reportId, req.body);
      if (!updatedReport) {
        return res.status(404).json({ message: "Monthly report not found" });
      }
      
      res.json(updatedReport);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
