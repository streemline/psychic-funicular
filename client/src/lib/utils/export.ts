import { TimeEntry, MonthlyReport, Project } from "@shared/schema";
import { formatDate, formatTime, formatDuration } from "./time";

// Define the export format type
export type ExportFormat = "pdf" | "excel" | "csv";

// Define the export options
export interface ExportOptions {
  format: ExportFormat;
  dateRange: string;
  startDate?: string;
  endDate?: string;
  includeTimeEntries: boolean;
  includeMonthlyReport: boolean;
  includeCharts: boolean;
}

/**
 * Generate a file name based on export options
 */
export function generateFileName(options: ExportOptions): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  let name = "time-tracking-";
  
  if (options.dateRange === "current_month") {
    name += "current-month";
  } else if (options.dateRange === "previous_month") {
    name += "previous-month";
  } else if (options.dateRange === "last_3_months") {
    name += "last-3-months";
  } else if (options.dateRange === "last_6_months") {
    name += "last-6-months";
  } else if (options.dateRange === "year_to_date") {
    name += "year-to-date";
  } else if (options.dateRange === "custom" && options.startDate && options.endDate) {
    name += `${options.startDate}-to-${options.endDate}`;
  } else {
    name += dateStr;
  }
  
  return `${name}.${options.format}`;
}

/**
 * Export time entries and reports to CSV format
 */
export function exportToCSV(
  timeEntries: TimeEntry[], 
  monthlyReports: MonthlyReport[],
  projects: Project[],
  options: ExportOptions
): string {
  let csvContent = '';
  
  // Add time entries if included
  if (options.includeTimeEntries && timeEntries.length > 0) {
    csvContent += 'Time Entries\n';
    csvContent += 'Date,Project,Start Time,End Time,Duration,Hourly Rate,Earnings,Notes\n';
    
    timeEntries.forEach(entry => {
      const project = projects.find(p => p.id === entry.projectId)?.name || 'Unknown';
      
      csvContent += [
        formatDate(entry.date),
        project,
        formatTime(entry.startTime),
        formatTime(entry.endTime),
        formatDuration(parseFloat(entry.duration.toString())),
        `$${parseFloat(entry.hourlyRate.toString()).toFixed(2)}`,
        `$${parseFloat(entry.earnings.toString()).toFixed(2)}`,
        `"${entry.notes || ''}"`
      ].join(',') + '\n';
    });
    
    csvContent += '\n';
  }
  
  // Add monthly reports if included
  if (options.includeMonthlyReport && monthlyReports.length > 0) {
    csvContent += 'Monthly Reports\n';
    csvContent += 'Month,Year,Hours Worked,Days Worked,Daily Average,Total Earnings,Status\n';
    
    monthlyReports.forEach(report => {
      const month = new Date(report.year, report.month - 1).toLocaleString('default', { month: 'long' });
      
      csvContent += [
        month,
        report.year,
        parseFloat(report.hoursWorked.toString()).toFixed(1),
        report.daysWorked,
        parseFloat(report.dailyAverage.toString()).toFixed(1),
        `$${parseFloat(report.totalEarnings.toString()).toFixed(2)}`,
        report.isCompleted ? 'Completed' : 'In Progress'
      ].join(',') + '\n';
    });
  }
  
  return csvContent;
}

/**
 * Function to trigger a file download
 */
export function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Main export function that handles the export based on format
 */
export async function exportData(
  timeEntries: TimeEntry[], 
  monthlyReports: MonthlyReport[],
  projects: Project[],
  options: ExportOptions
): Promise<void> {
  const fileName = generateFileName(options);
  
  if (options.format === 'csv') {
    const csvContent = exportToCSV(timeEntries, monthlyReports, projects, options);
    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8');
    return;
  }
  
  if (options.format === 'excel') {
    // For Excel export, we would typically use a library like XLSX
    // Since we're not actually implementing the full export here, just show a placeholder
    console.log('Excel export would be implemented with XLSX library');
    alert('Excel export functionality would be implemented with the XLSX library');
    return;
  }
  
  if (options.format === 'pdf') {
    // For PDF export, we would typically use a library like jsPDF
    // Since we're not actually implementing the full export here, just show a placeholder
    console.log('PDF export would be implemented with jsPDF library');
    alert('PDF export functionality would be implemented with the jsPDF library');
    return;
  }
}
