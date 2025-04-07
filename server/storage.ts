import { 
  User, InsertUser, 
  Project, InsertProject, 
  TimeEntry, InsertTimeEntry, 
  MonthlyReport, InsertMonthlyReport 
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;

  // Project operations
  getProjects(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Time entry operations
  getTimeEntries(userId: number): Promise<TimeEntry[]>;
  getTimeEntriesByMonth(userId: number, year: number, month: number): Promise<TimeEntry[]>;
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, timeEntryData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;

  // Monthly report operations
  getMonthlyReports(userId: number): Promise<MonthlyReport[]>;
  getMonthlyReport(userId: number, year: number, month: number): Promise<MonthlyReport | undefined>;
  createMonthlyReport(monthlyReport: InsertMonthlyReport): Promise<MonthlyReport>;
  updateMonthlyReport(id: number, reportData: Partial<InsertMonthlyReport>): Promise<MonthlyReport | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private timeEntries: Map<number, TimeEntry>;
  private monthlyReports: Map<number, MonthlyReport>;
  
  private userIdCounter: number;
  private projectIdCounter: number;
  private timeEntryIdCounter: number;
  private monthlyReportIdCounter: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.timeEntries = new Map();
    this.monthlyReports = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.timeEntryIdCounter = 1;
    this.monthlyReportIdCounter = 1;

    // Initialize with a default user
    this.createUser({
      username: "demo",
      password: "password",
      name: "Alex Denova",
      email: "alex@example.com",
      hourlyRate: "25",
      monthlyGoalHours: "160",
      initials: "AD"
    });

    // Initialize with default projects
    this.createProject({
      name: "Website Development",
      color: "#3b82f6",
      userId: 1
    });
    
    this.createProject({
      name: "UI Design",
      color: "#6366f1",
      userId: 1
    });
    
    this.createProject({
      name: "Content Creation",
      color: "#10b981",
      userId: 1
    });
    
    this.createProject({
      name: "Marketing",
      color: "#f59e0b",
      userId: 1
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    // Ensure all required fields are filled
    const newUser: User = { 
      ...user, 
      id: this.userIdCounter++,
      // Ensure these fields have default values if not provided
      hourlyRate: user.hourlyRate || "25",
      monthlyGoalHours: user.monthlyGoalHours || "160", 
      initials: user.initials || null
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Project operations
  async getProjects(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = { 
      ...project, 
      id: this.projectIdCounter++,
      // Ensure color has a default value
      color: project.color || "#3b82f6"
    };
    this.projects.set(newProject.id, newProject);
    return newProject;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;

    const updatedProject: Project = { ...project, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Time entry operations
  async getTimeEntries(userId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTimeEntriesByMonth(userId: number, year: number, month: number): Promise<TimeEntry[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return Array.from(this.timeEntries.values())
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entry.userId === userId && 
              entryDate >= startDate && 
              entryDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const newTimeEntry: TimeEntry = { 
      ...timeEntry, 
      id: this.timeEntryIdCounter++,
      // Ensure notes field is handled properly
      notes: timeEntry.notes || null
    };
    this.timeEntries.set(newTimeEntry.id, newTimeEntry);
    return newTimeEntry;
  }

  async updateTimeEntry(id: number, timeEntryData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const timeEntry = await this.getTimeEntry(id);
    if (!timeEntry) return undefined;

    const updatedTimeEntry: TimeEntry = { ...timeEntry, ...timeEntryData };
    this.timeEntries.set(id, updatedTimeEntry);
    return updatedTimeEntry;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  // Monthly report operations
  async getMonthlyReports(userId: number): Promise<MonthlyReport[]> {
    return Array.from(this.monthlyReports.values())
      .filter(report => report.userId === userId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }

  async getMonthlyReport(userId: number, year: number, month: number): Promise<MonthlyReport | undefined> {
    return Array.from(this.monthlyReports.values())
      .find(report => report.userId === userId && report.year === year && report.month === month);
  }

  async createMonthlyReport(monthlyReport: InsertMonthlyReport): Promise<MonthlyReport> {
    const newMonthlyReport: MonthlyReport = { 
      ...monthlyReport, 
      id: this.monthlyReportIdCounter++,
      // Ensure isCompleted has a default value
      isCompleted: monthlyReport.isCompleted === undefined ? false : monthlyReport.isCompleted
    };
    this.monthlyReports.set(newMonthlyReport.id, newMonthlyReport);
    return newMonthlyReport;
  }

  async updateMonthlyReport(id: number, reportData: Partial<InsertMonthlyReport>): Promise<MonthlyReport | undefined> {
    const report = this.monthlyReports.get(id);
    if (!report) return undefined;

    const updatedReport: MonthlyReport = { ...report, ...reportData };
    this.monthlyReports.set(id, updatedReport);
    return updatedReport;
  }
}

// Import database storage implementation
import { DbStorage } from './dbStorage';

// Use database storage if DATABASE_URL is set, otherwise use memory storage
export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
