import { format, addMonths, subMonths, getYear, getMonth, getDaysInMonth, isWeekend } from 'date-fns';
import { uk } from 'date-fns/locale';
import i18next from 'i18next';

export function formatDateToUkrainian(date: Date): string {
  return format(date, 'LLLL yyyy р.', { locale: uk });
}

export function getMonthName(month: number): string {
  // month: 1-12
  return i18next.t(`dates.months.${month - 1}`);
}

export function getDayOfWeekName(dayNumber: number): string {
  // dayNumber: 1-7 (Пн-Нд)
  return i18next.t(`dates.days.${(dayNumber - 1) % 7}`);
}

export function getDayOfWeekAbbr(dayNumber: number): string {
  // dayNumber: 1-7 (пн-нд)
  return i18next.t(`dates.daysShort.${(dayNumber - 1) % 7}`);
}

export function nextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function previousMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function calculateWorkDaysInMonth(date: Date, workDays: number[] = [1, 2, 3, 4, 5]): number {
  const year = getYear(date);
  const month = getMonth(date);
  const daysInMonth = getDaysInMonth(new Date(year, month));
  let workDaysCount = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
    
    if (workDays.includes(dayOfWeek)) {
      workDaysCount++;
    }
  }
  
  return workDaysCount;
}

export function isWorkDay(date: Date, workDays: number[] = [1, 2, 3, 4, 5]): boolean {
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
  return workDays.includes(dayOfWeek);
}
