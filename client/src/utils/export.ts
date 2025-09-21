import { TimeEntry, MonthlyReport, User } from '@shared/schema';
import { formatDateToUkrainian, getMonthName, getDayOfWeekName } from './dates';
import { formatMinutesToHours, secondsToHMS } from './time';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// Импортируем jspdf-autotable
import 'jspdf-autotable';
import i18next from 'i18next';

interface ExportOptions {
  includeProfile: boolean;
  includeNotes: boolean;
  includeSalary: boolean;
  includeProjects: boolean;
  includeActions: boolean;
}

// Функция для форматирования даты в формате ДД.ММ.ГГГГ
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Generate a PDF file structure for exporting time tracking data
 * Uses jsPDF and jspdf-autotable to create a PDF based on the template
 */
export async function generatePdfExport(
  user: User,
  entries: TimeEntry[],
  monthlyReport: MonthlyReport,
  options: ExportOptions
): Promise<Blob> {
  try {
    // Создаем документ PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const t = i18next.t.bind(i18next);
    
    // Заголовок и информация о профиле
    doc.setFontSize(18);
    doc.text(t('export.title'), pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    const year = monthlyReport.year;
    const month = getMonthName(monthlyReport.month);
    doc.text(t('export.monthYear', { month, year }), pageWidth / 2, 23, { align: 'center' });
    
    let yPos = 35;
    
    // Информация о профиле
    if (options.includeProfile && user) {
      doc.setFontSize(10);
      doc.text(`${t('export.profile.name')}: ${user.fullName || ''}`, 15, yPos);
      yPos += 7;
      doc.text(`${t('export.profile.position')}: ${user.position || ''}`, 15, yPos);
      yPos += 7;
      doc.text(`${t('export.profile.contact')}: ${user.email || ''}`, 15, yPos);
      yPos += 10;
    }
    
    // Заголовки таблицы
    const headers = t('export.tableHeaders', { returnObjects: true }) as string[];
    const colWidths = [22, 50, 18, 18, 17, 25, 25]; // Определяем ширину каждой колонки
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableX = (pageWidth - tableWidth) / 2;
    
    // Рисуем заголовки таблицы
    doc.setFillColor(220, 220, 220);
    doc.setDrawColor(0);
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Рисуем ячейки заголовка
    let xPos = 15;
    doc.rect(xPos, yPos, tableWidth, 10, 'F');
    
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], xPos + 2, yPos + 6);
      xPos += colWidths[i];
    }
    
    yPos += 10;
    
    // Рисуем строки данных
    doc.setFont('helvetica', 'normal');
    let totalPayment = 0;
    
    entries.forEach((entry, index) => {
      const totalMinutes = calculateMinutes(entry.startTime, entry.endTime);
      const hoursWorked = (totalMinutes / 60).toFixed(2);
      const hourlyRate = entry.hourlyRate || 0;
      const payment = Math.round(totalMinutes / 60 * hourlyRate);
      totalPayment += payment;
      
      const rowData = [
        formatDate(entry.date),
        entry.notes || '',
        entry.startTime,
        entry.endTime,
        hoursWorked,
        `${hourlyRate} CZK`,
        `${payment} CZK`,
      ];
      
      // Чередуем цвет строк
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      
      // Рисуем фон строки
      doc.rect(15, yPos, tableWidth, 8, 'F');
      
      // Рисуем содержимое строки
      xPos = 15;
      for (let i = 0; i < rowData.length; i++) {
        // Обрезаем текст, если он слишком длинный
        let text = rowData[i];
        if (i === 1 && text.length > 20) { // Для колонки с заметками
          text = text.substring(0, 17) + '...';
        }
        doc.text(text, xPos + 2, yPos + 5);
        xPos += colWidths[i];
      }
      
      yPos += 8;
      
      // Если страница заполнена, создаем новую
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Рисуем итоговую информацию
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(t('export.summary'), 15, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.text(t('export.totalWorked', { hours: formatMinutesToHours(monthlyReport.workedMinutes) }), 15, yPos);
    yPos += 7;
    
    doc.text(t('export.totalPayment', { amount: totalPayment }), 15, yPos);
    yPos += 7;
    
    doc.text(t('export.workDays', { count: monthlyReport.workDays }), 15, yPos);
    yPos += 14;
    
    // Подпись и дата
    const today = new Date();
    doc.text(t('export.date', { date: formatDate(today) }), 15, yPos);
    doc.text(t('export.signature'), 100, yPos);
    
    // Возвращаем PDF как Blob
    const pdfOutput = doc.output('arraybuffer');
    return new Blob([pdfOutput], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error}`);
  }
}

// Вспомогательная функция для расчета минут между временем начала и конца
function calculateMinutes(start: string, end: string): number {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
}

/**
 * Generate an Excel file structure for exporting time tracking data
 * Uses xlsx library to create an Excel file based on the template
 */
export async function generateExcelExport(
  user: User,
  entries: TimeEntry[],
  monthlyReport: MonthlyReport,
  options: ExportOptions
): Promise<Blob> {
  const t = i18next.t.bind(i18next);
  const workbook = XLSX.utils.book_new();

  const headers = t('export.tableHeaders', { returnObjects: true }) as string[];

  const data = entries.map(entry => {
    const totalMinutes = calculateMinutes(entry.startTime, entry.endTime);
    const hoursWorked = (totalMinutes / 60).toFixed(2);
    const hourlyRate = entry.hourlyRate || 0;
    const payment = Math.round(totalMinutes / 60 * hourlyRate);
    return [
      formatDate(entry.date),
      entry.notes || '',
      entry.startTime,
      entry.endTime,
      hoursWorked,
      `${hourlyRate} CZK`,
      `${payment} CZK`,
    ];
  });

  const titleRows = [
    [t('export.title')],
    [t('export.monthYear', { month: getMonthName(monthlyReport.month), year: monthlyReport.year })],
    [],
  ];

  if (options.includeProfile && user) {
    titleRows.push(
      [t('export.profile.name') + ':', user.fullName || ''],
      [t('export.profile.position') + ':', user.position || ''],
      [t('export.profile.contact') + ':', user.email || ''],
      []
    );
  }

  const wsData = [
    ...titleRows,
    headers,
    ...data,
    [],
    [t('export.summary')],
    [t('export.totalWorked', { hours: formatMinutesToHours(monthlyReport.workedMinutes) })],
    [t('export.totalPayment', { amount: calculateTotalPayment(entries) })],
    [t('export.workDays', { count: monthlyReport.workDays })],
    [],
    [t('export.date', { date: formatDate(new Date()) })],
    [t('export.signature')]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  const colWidths = [
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
  ];
  worksheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(workbook, worksheet, t('export.title'));
  const excelOutput = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelOutput], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Вспомогательная функция для расчета общей суммы оплаты
function calculateTotalPayment(entries: TimeEntry[]): number {
  let totalPayment = 0;
  entries.forEach(entry => {
    const totalMinutes = calculateMinutes(entry.startTime, entry.endTime);
    const hourlyRate = entry.hourlyRate || 0;
    totalPayment += Math.round(totalMinutes / 60 * hourlyRate);
  });
  return totalPayment;
}

/**
 * Generate a CSV file structure for exporting time tracking data
 */
export async function generateCsvExport(
  user: User,
  entries: TimeEntry[],
  monthlyReport: MonthlyReport,
  options: ExportOptions
): Promise<Blob> {
  const t = i18next.t.bind(i18next);
  let csvContent = 'sep=,\n';
  csvContent += t('export.csvHeaders', { joinArrays: ',', defaultValue: 'Дата,День недели,Начало,Конец,Перерыв,Отработано,Примечания' }) + '\n';
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString();
    const dayOfWeek = getDayOfWeekName(date.getDay() === 0 ? 7 : date.getDay());
    const breakTime = '';
    csvContent += `${formattedDate},${dayOfWeek},${entry.startTime},${entry.endTime},${breakTime},"${entry.notes || ''}"\n`;
  });
  csvContent += `\n${t('export.summary')}\n`;
  csvContent += `${t('export.monthYear', { month: getMonthName(monthlyReport.month), year: monthlyReport.year })}\n`;
  csvContent += `${t('export.workDays', { count: monthlyReport.workDays })}\n`;
  csvContent += `${t('export.totalWorked', { hours: formatMinutesToHours(monthlyReport.workedMinutes) })}\n`;
  csvContent += `${t('export.totalPayment', { amount: calculateTotalPayment(entries) })}\n`;
  if (options.includeProfile && user) {
    csvContent += `\n${t('export.profileInfo')}\n`;
    csvContent += `${t('export.profile.name')},${user.fullName}\n`;
    csvContent += `${t('export.profile.position')},${user.position || ''}\n`;
    csvContent += `${t('export.profile.contact')},${user.email || ''}\n`;
  }
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportTimeTracking(
  format: 'pdf' | 'excel' | 'csv',
  user: User,
  entries: TimeEntry[],
  monthlyReport: MonthlyReport,
  options: ExportOptions,
  filename: string
): Promise<void> {
  let blob: Blob;
  
  switch (format) {
    case 'pdf':
      blob = await generatePdfExport(user, entries, monthlyReport, options);
      downloadBlob(blob, `${filename}.pdf`);
      break;
    case 'excel':
      blob = await generateExcelExport(user, entries, monthlyReport, options);
      downloadBlob(blob, `${filename}.xlsx`);
      break;
    case 'csv':
      blob = await generateCsvExport(user, entries, monthlyReport, options);
      downloadBlob(blob, `${filename}.csv`);
      break;
  }
}
