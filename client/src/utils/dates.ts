import { format, addMonths, subMonths, getYear, getMonth, getDaysInMonth, isWeekend } from 'date-fns';
import { uk } from 'date-fns/locale';

export function formatDateToUkrainian(date: Date): string {
  return format(date, 'LLLL yyyy р.', { locale: uk });
}

export function getMonthName(month: number): string {
  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];
  
  return monthNames[month - 1];
}

export function getDayOfWeekName(dayNumber: number): string {
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  return dayNames[(dayNumber - 1) % 7];
}

export function getDayOfWeekAbbr(dayNumber: number): string {
  const dayNames = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'];
  return dayNames[(dayNumber - 1) % 7];
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
