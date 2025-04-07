import { TimeEntry, MonthlyReport, User } from '@shared/schema';
import { formatDateToUkrainian, getMonthName } from './dates';
import { formatMinutesToHours, secondsToHMS } from './time';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// Импортируем jspdf-autotable
import 'jspdf-autotable';

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
    
    // Заголовок и информация о профиле
    doc.setFontSize(18);
    doc.text('Výkaz práce', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    const year = monthlyReport.year;
    const month = getMonthName(monthlyReport.month);
    doc.text(`${month} ${year}`, pageWidth / 2, 23, { align: 'center' });
    
    let yPos = 35;
    
    // Информация о профиле
    if (options.includeProfile && user) {
      doc.setFontSize(10);
      doc.text(`Jméno: ${user.fullName || ''}`, 15, yPos);
      yPos += 7;
      doc.text(`Pozice: ${user.position || ''}`, 15, yPos);
      yPos += 7;
      doc.text(`Kontakt: ${user.email || ''}`, 15, yPos);
      yPos += 10;
    }
    
    // Заголовки таблицы
    const headers = ['Datum', 'Název akce', 'Od', 'Do', 'Hodiny', 'Sazba', 'Částka'];
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
    doc.text('Souhrn:', 15, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Celkem odpracováno: ${formatMinutesToHours(monthlyReport.workedMinutes)} hodin`, 15, yPos);
    yPos += 7;
    
    doc.text(`Celková částka: ${totalPayment} CZK`, 15, yPos);
    yPos += 7;
    
    doc.text(`Počet pracovních dnů: ${monthlyReport.workDays}`, 15, yPos);
    yPos += 14;
    
    // Подпись и дата
    const today = new Date();
    doc.text(`Datum: ${formatDate(today)}`, 15, yPos);
    doc.text('Podpis:', 100, yPos);
    
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
  // Создаем новую книгу Excel
  const workbook = XLSX.utils.book_new();
  
  // Подготавливаем заголовки и данные для отработанного времени
  const headers = ['Datum', 'Název akce', 'Od', 'Do', 'Hodiny', 'Sazba', 'Částka'];
  
  const data = entries.map(entry => {
    // Вычисляем общее кол-во отработанных часов
    const totalMinutes = calculateMinutes(entry.startTime, entry.endTime);
    const hoursWorked = (totalMinutes / 60).toFixed(2);
    
    // Вычисляем оплату
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
  
  // Добавляем заголовок и информацию о пользователе
  const titleRows = [
    ['Výkaz práce'],
    [`${getMonthName(monthlyReport.month)} ${monthlyReport.year}`],
    [],
  ];
  
  // Если включена опция профиля, добавляем информацию о пользователе
  if (options.includeProfile && user) {
    titleRows.push(
      ['Jméno:', user.fullName || ''],
      ['Pozice:', user.position || ''],
      ['Kontakt:', user.email || ''],
      []
    );
  }
  
  // Соединяем все данные для листа
  const wsData = [
    ...titleRows,
    headers,
    ...data,
    [],
    ['Souhrn:'],
    ['Celkem odpracováno:', `${formatMinutesToHours(monthlyReport.workedMinutes)} hodin`],
    ['Celková částka:', calculateTotalPayment(entries) + ' CZK'],
    ['Počet pracovních dnů:', monthlyReport.workDays.toString()],
    [],
    [`Datum: ${formatDate(new Date())}`],
    ['Podpis:']
  ];
  
  // Создаем рабочий лист и добавляем его в книгу
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  
  // Настройка стилей (в XLSX библиотеке ограниченные возможности для стилей)
  // Можно только установить свойства ячеек
  
  // Устанавливаем ширину столбцов
  const colWidths = [
    { wch: 12 }, // Datum
    { wch: 30 }, // Název akce
    { wch: 10 }, // Od
    { wch: 10 }, // Do
    { wch: 10 }, // Hodiny
    { wch: 12 }, // Sazba
    { wch: 12 }, // Částka
  ];
  
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Výkaz práce');
  
  // Преобразуем книгу в бинарные данные
  const excelOutput = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Возвращаем как Blob
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
  let csvContent = 'sep=,\n';
  
  // Add headers
  csvContent += 'Дата,День тижня,Початок,Кінець,Перерва,Відпрацьовано,Примітки\n';
  
  // Add data
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const formattedDate = date.toLocaleDateString('uk-UA');
    const dayOfWeek = date.toLocaleDateString('uk-UA', { weekday: 'short' });
    
    // Мы не храним информацию о перерывах в нашей модели данных, поэтому breakTime всегда будет пустым
    const breakTime = '';
    
    csvContent += `${formattedDate},${dayOfWeek},${entry.startTime},${entry.endTime},${breakTime},"${entry.notes || ''}"\n`;
  });
  
  // Add summary
  csvContent += '\nЗведення\n';
  csvContent += `Місяць,${getMonthName(monthlyReport.month)} ${monthlyReport.year}\n`;
  csvContent += `Робочі дні,${monthlyReport.workDays}\n`;
  csvContent += `Відпрацьовано,${formatMinutesToHours(monthlyReport.workedMinutes)}\n`;
  csvContent += `Понаднормові,${formatMinutesToHours(monthlyReport.overtimeMinutes)}\n`;
  csvContent += `Відпустка,${monthlyReport.vacationDays} днів\n`;
  
  if (options.includeProfile && user) {
    csvContent += '\nІнформація профілю\n';
    csvContent += `Ім'я,${user.fullName}\n`;
    csvContent += `Посада,${user.position || ''}\n`;
    csvContent += `Контакт,${user.email || ''}\n`;
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
