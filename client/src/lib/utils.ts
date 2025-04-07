import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeDisplay(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  return { hours, minutes };
}

export function calculateTotalMinutes(start: string, end: string): number {
  const startTime = parseTimeString(start);
  const endTime = parseTimeString(end);
  
  const startMinutes = startTime.hours * 60 + startTime.minutes;
  const endMinutes = endTime.hours * 60 + endTime.minutes;
  
  return endMinutes - startMinutes;
}

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const remainingMinutes = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? '-' : '';
  
  return `${sign}${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
}

export function getProgressPercentage(workedMinutes: number, targetMinutes: number): number {
  if (targetMinutes === 0) return 0;
  const percentage = (workedMinutes / targetMinutes) * 100;
  return Math.min(Math.max(percentage, 0), 100);
}
