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

export function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function calculateBreakMinutes(breakStart: string, breakEnd: string): number {
  return calculateTotalMinutes(breakStart, breakEnd);
}

export function calculateWorkTimeWithBreak(
  startTime: string, 
  endTime: string, 
  breakStart: string | null, 
  breakEnd: string | null
): number {
  const totalMinutes = calculateTotalMinutes(startTime, endTime);
  
  if (breakStart && breakEnd) {
    const breakMinutes = calculateTotalMinutes(breakStart, breakEnd);
    return totalMinutes - breakMinutes;
  }
  
  return totalMinutes;
}

export function secondsToHMS(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function roundMinutesToNearest(minutes: number, nearest: number = 15): number {
  return Math.round(minutes / nearest) * nearest;
}
