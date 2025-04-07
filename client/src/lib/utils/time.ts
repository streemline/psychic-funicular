import { format, differenceInMinutes, parseISO, addHours } from "date-fns";

/**
 * Calculate duration in hours between two time strings in format "HH:MM"
 */
export function calculateDuration(startTime: string, endTime: string): number {
  // Parse the times to create date objects
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  
  // Create base date objects
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  
  let startDate = new Date(baseDate);
  startDate.setHours(startHours, startMinutes);
  
  let endDate = new Date(baseDate);
  endDate.setHours(endHours, endMinutes);
  
  // Handle overnight time entries (end time is earlier than start time)
  if (endDate < startDate) {
    endDate = addHours(endDate, 24);
  }
  
  // Calculate the difference in minutes and convert to hours
  const durationMinutes = differenceInMinutes(endDate, startDate);
  return durationMinutes / 60;
}

/**
 * Format duration in hours to a human-readable string (e.g., "5h 30m")
 */
export function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
}

/**
 * Format time from 24-hour format to 12-hour format with AM/PM
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Format date in a readable format (e.g., "Aug 15, 2023")
 */
export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, "MMM dd, yyyy");
}

/**
 * Calculate earnings based on duration and hourly rate
 */
export function calculateEarnings(duration: number, hourlyRate: number): number {
  return duration * hourlyRate;
}

/**
 * Calculate monthly progress percentage based on current hours and goal
 */
export function calculateMonthlyProgress(hoursWorked: number, goalHours: number): number {
  return Math.min(100, Math.round((hoursWorked / goalHours) * 100));
}

/**
 * Group time entries by date
 */
export function groupEntriesByDate(entries: any[]): Record<string, any[]> {
  return entries.reduce((groups, entry) => {
    const date = entry.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});
}

/**
 * Sort dates in descending order (newest first)
 */
export function sortDateStringsDesc(dates: string[]): string[] {
  return [...dates].sort((a, b) => {
    return parseISO(b).getTime() - parseISO(a).getTime();
  });
}
