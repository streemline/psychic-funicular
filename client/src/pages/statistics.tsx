import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressCircle } from '@/components/ui/progress-circle';
import { MonthCard } from '@/components/ui/month-card';
import { AnimatedEntry, AnimatedEntryRow, AnimatedFade } from '@/components/ui/animated-entry';
import { formatMinutesToHours, getProgressPercentage } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { 
  Clock, 
  HourglassIcon, 
  UmbrellaIcon,
  ChevronLeft,
  ChevronRight,
  Settings,
  Pencil,
  Trash2
} from 'lucide-react';
import { MonthlyReport, TimeEntry, User } from '@shared/schema';
import { add, format, getMonth, getYear, parseISO, setMonth, setYear } from 'date-fns';
import { uk } from 'date-fns/locale';
import EditEntryModal from '@/components/modals/edit-entry-modal';
import ExportModal from '@/components/modals/export-modal';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';

export default function Statistics() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const year = getYear(selectedDate);
  const month = getMonth(selectedDate) + 1;
  
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
  
  const { data: currentMonthReport, isLoading: isReportLoading } = useQuery<MonthlyReport>({
    queryKey: [`/api/monthly-reports/${year}/${month}`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user,
  });
  
  const { data: allMonthlyReports, isLoading: isAllReportsLoading } = useQuery<MonthlyReport[]>({
    queryKey: ['/api/monthly-reports'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user,
  });
  
  const { data: timeEntries, isLoading: isEntriesLoading } = useQuery<TimeEntry[]>({
    queryKey: [`/api/time-entries/${year}/${month}`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user,
  });
  
  const calculateMinutes = (start: string, end: string): number => {
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  };
  
  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };
  
  // Helper function for calculating the total payment for the month
  const calculateTotalPayment = (): number => {
    if (!timeEntries || !Array.isArray(timeEntries) || timeEntries.length === 0) return 0;
    
    return timeEntries.reduce((total, entry) => {
      // Calculate total minutes worked for this entry
      const totalMinutes = calculateMinutes(entry.startTime, entry.endTime);
      const hours = totalMinutes / 60;
      
      // Calculate payment based on hourly rate
      const hourlyRate = entry.hourlyRate || 0;
      const payment = Math.round(hours * hourlyRate);
      
      return total + payment;
    }, 0);
  };
  
  const handlePreviousPeriod = () => {
    setSelectedDate(prev => {
      // Go to previous month
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  const handleNextPeriod = () => {
    setSelectedDate(prev => {
      // Go to next month
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  const getDayOfWeek = (day: number): string => {
    const days = [t('mon_short'), t('tue_short'), t('wed_short'), t('thu_short'), t('fri_short'), t('sat_short'), t('sun_short')];
    return days[(day - 1) % 7];
  };
  
  // Мутация для удаления записи
  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: number) => apiRequest('DELETE', `/api/time-entries/${entryId}`),
    onSuccess: () => {
      toast({
        title: t('entry_deleted'),
        description: t('entry_deleted_desc'),
      });
      
      // Обновляем данные
      queryClient.invalidateQueries({ queryKey: [`/api/time-entries/${year}/${month}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/monthly-reports/${year}/${month}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-reports'] });
      
      setDeleteDialogOpen(false);
      setSelectedEntryId(null);
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('delete_entry_error', { error }),
        variant: 'destructive',
      });
    }
  });
  
  // Функция для открытия модального окна редактирования
  const handleEditEntry = (entryId: number) => {
    setSelectedEntryId(entryId);
    setEditModalOpen(true);
  };
  
  // Функция для открытия диалога удаления
  const handleDeleteEntry = (entryId: number) => {
    setSelectedEntryId(entryId);
    setDeleteDialogOpen(true);
  };
  
  // Функция для подтверждения удаления
  const confirmDelete = () => {
    if (selectedEntryId) {
      deleteEntryMutation.mutate(selectedEntryId);
    }
  };
  
  // Generate calendar rows for the current month
  const generateCalendarRows = () => {
    if (!timeEntries || !Array.isArray(timeEntries)) return [];
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const rows = [];
    
    const workDays = user?.workDays?.split(',').map(Number) || [1, 2, 3, 4, 5];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert Sunday from 0 to 7
      const isWorkDay = workDays.includes(dayOfWeek);
      
      const entriesForDay = timeEntries.filter(entry => {
        // Проверяем, является ли entry.date строкой или объектом Date
        const entryDate = typeof entry.date === 'string' ? parseISO(entry.date) : new Date(entry.date);
        return entryDate.getDate() === day;
      });
      
      let startTime = '-';
      let endTime = '-';
      let hoursWorked = '-';
      let payment = '-';
      let notes = '';
      let entryId: number | null = null;
      
      if (entriesForDay.length > 0) {
        const entry = entriesForDay[0];
        startTime = entry.startTime;
        endTime = entry.endTime;
        notes = entry.notes || '';
        entryId = entry.id;
        
        // Calculate total worked minutes
        let totalMinutes = calculateMinutes(entry.startTime, entry.endTime);
        hoursWorked = formatMinutes(totalMinutes);
        
        // Calculate payment based on hourly rate and worked time
        const hourlyRate = entry.hourlyRate || 0;
        const hours = totalMinutes / 60;
        const paymentValue = Math.round(hours * hourlyRate);
        payment = `${paymentValue} CZK`;
      }
      
      rows.push({
        day,
        dayOfWeek: getDayOfWeek(dayOfWeek),
        isWeekend: !isWorkDay,
        startTime,
        endTime,
        hoursWorked,
        payment,
        notes,
        entryId
      });
    }
    
    return rows;
  };
  
  // Sort reports in reverse chronological order
  const sortedReports = allMonthlyReports && Array.isArray(allMonthlyReports)
    ? [...allMonthlyReports]
        .sort((a, b) => {
          // Sort by year descending
          if (a.year !== b.year) {
            return b.year - a.year;
          }
          // Then by month descending
          return b.month - a.month;
        })
        .filter(report => report.year !== year || report.month !== month) // Exclude current month
    : [];
  
  const progressPercentage = currentMonthReport
    ? getProgressPercentage(currentMonthReport.workedMinutes, currentMonthReport.targetMinutes)
    : 0;
  
  const calendarRows = generateCalendarRows();
  const formattedMonth = format(selectedDate, 'LLLL yyyy р.', { locale: uk });
  
  return (
    <div className="pb-24">
      {/* Period Selector */}
      <AnimatedFade>
        <div className="flex items-center justify-between bg-card px-4 py-3 border-b border-gray-700">
          <button className="text-lg" onClick={handlePreviousPeriod}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <h2 className="text-lg font-medium capitalize">{formattedMonth}</h2>
            <button className="ml-2 text-muted-foreground">
              <Settings className="h-4 w-4" />
            </button>
          </div>
          <button className="text-lg" onClick={handleNextPeriod}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </AnimatedFade>
      
      {/* Month Summary */}
      {isReportLoading ? (
        <Card className="p-4 bg-card mx-4 mt-4">
          <CardContent className="p-0">
            <div className="h-32 flex items-center justify-center">
              <p>Завантаження даних...</p>
            </div>
          </CardContent>
        </Card>
      ) : currentMonthReport && (
        <AnimatedEntry delay={0.1}>
          <Card className="bg-card mx-4 mt-4">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4">
                <AnimatedEntry delay={0.2}>
                  <div className="flex items-center">
                    <Clock className="text-primary mr-3 h-5 w-5" />
                    <span>Відпрацьовані години</span>
                    <span className="ml-auto font-medium">
                      {formatMinutesToHours(currentMonthReport.workedMinutes)} ч
                    </span>
                  </div>
                </AnimatedEntry>
                
                <AnimatedEntry delay={0.3}>
                  <div className="flex items-center mt-3">
                    <div className="text-primary mr-3 h-5 w-5">₴</div>
                    <span>Загальна оплата</span>
                    <span className="ml-auto font-medium">
                      {calculateTotalPayment()} CZK
                    </span>
                  </div>
                </AnimatedEntry>
                
                <AnimatedEntry delay={0.4}>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <span>Робочі дні: {currentMonthReport.workDays} д</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>Робочі години: {formatMinutesToHours(currentMonthReport.targetMinutes)} ч</span>
                    </div>
                  </div>
                </AnimatedEntry>
              </div>
            </CardContent>
          </Card>
        </AnimatedEntry>
      )}
      
      {/* Work Time Chart */}
      <AnimatedEntry delay={0.5}>
        <Card className="bg-card mx-4 mt-4">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Статистика місяця</h3>
            
            <AnimatedFade delay={0.7}>
              <div className="flex justify-center mb-6">
                <ProgressCircle percentage={progressPercentage} size={128} />
              </div>
            </AnimatedFade>
            
            {currentMonthReport && (
              <AnimatedEntry delay={0.8}>
                <div className="flex justify-between text-sm text-muted-foreground border-t border-gray-700 pt-3">
                  <span>Заработано: {calculateTotalPayment()} CZK</span>
                  <span>
                    {formatMinutesToHours(currentMonthReport.workedMinutes)} ч
                  </span>
                </div>
              </AnimatedEntry>
            )}
          </CardContent>
        </Card>
      </AnimatedEntry>
      
      {/* Calendar View */}
      <AnimatedEntry delay={0.9}>
        <div className="mt-4 mx-4 overflow-x-auto">
          <table className="w-full bg-card rounded-lg shadow-lg">
            <thead>
              <tr className="text-muted-foreground border-b border-gray-700">
                <th className="p-2 text-center w-10">Дата</th>
                <th className="p-2 text-center">Название акции</th>
                <th className="p-2 text-center">Вхід</th>
                <th className="p-2 text-center">Вихід</th>
                <th className="p-2 text-center">Годин</th>
                <th className="p-2 text-center">Оплата</th>
                <th className="p-2 text-center">Дії</th>
              </tr>
            </thead>
            <tbody>
              {isEntriesLoading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">Завантаження даних...</td>
                </tr>
              ) : (
                calendarRows.map((row, index) => (
                  <AnimatedEntryRow 
                    key={row.day} 
                    index={index}
                    className={`border-b border-gray-700 ${row.isWeekend ? 'bg-weekend/30' : ''}`}
                  >
                    <td className="p-2 text-center">{row.day} {row.dayOfWeek}</td>
                    <td className="p-2 text-center">{row.notes || "-"}</td>
                    <td className="p-2 text-center text-primary">{row.startTime}</td>
                    <td className="p-2 text-center text-primary">{row.endTime}</td>
                    <td className="p-2 text-center">{row.hoursWorked}</td>
                    <td className="p-2 text-center text-success">{row.payment}</td>
                    <td className="p-2 text-center">
                      {row.entryId ? (
                        <div className="flex justify-center space-x-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEditEntry(row.entryId!)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteEntry(row.entryId!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </AnimatedEntryRow>
                ))
              )}
            </tbody>
          </table>
          
          {/* Export Button */}
          <div className="flex justify-end mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.3 }}
              className="w-full sm:w-auto"
            >
              <Button 
                onClick={() => setExportModalOpen(true)}
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Експортувати
                </span>
              </Button>
            </motion.div>
          </div>
        </div>
      </AnimatedEntry>
      
      {/* Monthly Summary Cards */}
      <AnimatedEntry delay={1.1}>
        <div className="px-4 mt-6">
          <h3 className="text-lg font-medium mb-3">Помісячний огляд</h3>
          
          {isAllReportsLoading ? (
            <p className="text-center p-4">Завантаження даних...</p>
          ) : (
            sortedReports.map((report, index) => (
              <AnimatedEntry 
                key={`${report.year}-${report.month}`} 
                index={index}
                delay={1.2}
              >
                <MonthCard report={report} />
              </AnimatedEntry>
            ))
          )}
        </div>
      </AnimatedEntry>
      
      {/* Модальное окно редактирования */}
      <EditEntryModal 
        open={editModalOpen} 
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEntryId(null);
        }} 
        entryId={selectedEntryId} 
      />
      
      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие удалит запись о рабочем времени. Это действие невозможно отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEntryId(null)}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteEntryMutation.isPending}
            >
              {deleteEntryMutation.isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Модальное окно экспорта */}
      {user && currentMonthReport && timeEntries && (
        <ExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          user={user}
          entries={timeEntries}
          monthlyReport={currentMonthReport}
          year={year}
          month={month}
        />
      )}
    </div>
  );
}
