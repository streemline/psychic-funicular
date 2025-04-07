import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';
import { getQueryFn } from '@/lib/queryClient';
import { motion } from 'framer-motion';
import { type TimeEntry } from '@shared/schema';

interface EditEntryModalProps {
  open: boolean;
  onClose: () => void;
  entryId: number | null;
}

interface FormValues {
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  notes: string;
}

export default function EditEntryModal({ open, onClose, entryId }: EditEntryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentEntryDate, setCurrentEntryDate] = useState<string>('');
  
  // Получаем данные записи, которую нужно отредактировать
  const { data: timeEntry, isLoading } = useQuery<TimeEntry>({
    queryKey: [`/api/time-entries/${entryId}`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: open && !!entryId, // запрос выполняется только когда модальное окно открыто и есть ID записи
  });
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // формат yyyy-MM-dd
      startTime: '08:00',
      endTime: '18:00',
      hourlyRate: 190,
      notes: '',
    }
  });
  
  // Заполняем форму данными записи, когда она загружена
  useEffect(() => {
    if (timeEntry) {
      // Преобразуем ISO дату в локальный формат yyyy-MM-dd
      const dateObj = typeof timeEntry.date === 'string' ? parseISO(timeEntry.date) : new Date(timeEntry.date);
      const formattedDate = format(dateObj, 'yyyy-MM-dd');
      setCurrentEntryDate(typeof timeEntry.date === 'string' ? timeEntry.date : timeEntry.date.toISOString());
      
      setValue('date', formattedDate);
      setValue('startTime', timeEntry.startTime);
      setValue('endTime', timeEntry.endTime);
      setValue('hourlyRate', timeEntry.hourlyRate || 190);
      setValue('notes', timeEntry.notes || '');
    }
  }, [timeEntry, setValue]);
  
  // Мутация для обновления записи
  const updateEntryMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/time-entries/${entryId}`, data),
    onSuccess: () => {
      toast({
        title: 'Запись обновлена',
        description: 'Запись о рабочем времени успешно обновлена',
      });
      
      // Получаем текущую дату из сохраненной переменной
      const currentDate = new Date(currentEntryDate || new Date());
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // Инвалидируем все необходимые запросы для обновления данных
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      queryClient.invalidateQueries({ queryKey: [`/api/time-entries/${year}/${month}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/monthly-reports/${year}/${month}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-reports'] });
      
      reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: `Не удалось обновить запись: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: FormValues) => {
    if (!entryId) return;
    
    // Преобразуем строку даты в формат ISO с полуднем для избежания проблем с часовым поясом
    const formattedDate = `${data.date}T12:00:00.000Z`;
    setCurrentEntryDate(formattedDate);
    
    const updateData = {
      date: formattedDate,
      startTime: data.startTime,
      endTime: data.endTime,
      hourlyRate: data.hourlyRate,
      notes: data.notes,
    };
    
    updateEntryMutation.mutate(updateData);
  };
  
  // Анимация для полей формы
  const formAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    })
  };
  
  if (isLoading && open) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-card max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Загрузка</DialogTitle>
            <DialogDescription className="sr-only">Загрузка данных записи</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <p>Загрузка данных...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card max-w-md mx-auto">
        <DialogHeader className="bg-primary -mx-6 -mt-6 px-6 py-3 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <DialogTitle className="text-white">Редактировать запись</DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              Изменение данных записи рабочего времени
            </DialogDescription>
          </motion.div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={formAnimation}
            key="date-field"
          >
            <Label htmlFor="date" className="text-muted-foreground">Дата</Label>
            <Input 
              id="date" 
              type="date" 
              className="bg-background border-input" 
              {...register('date', { required: true })} 
            />
          </motion.div>
          
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={formAnimation}
            key="notes-field"
          >
            <Label htmlFor="notes" className="text-muted-foreground">Название акции</Label>
            <Textarea 
              id="notes" 
              className="bg-background border-input h-20 resize-none" 
              {...register('notes')} 
            />
          </motion.div>
          
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={formAnimation}
            className="grid grid-cols-2 gap-4"
            key="time-fields"
          >
            <div>
              <Label htmlFor="startTime" className="text-muted-foreground">Початок</Label>
              <Input 
                id="startTime" 
                type="time" 
                className="bg-background border-input" 
                {...register('startTime', { required: true })} 
              />
            </div>
            <div>
              <Label htmlFor="endTime" className="text-muted-foreground">Кінець</Label>
              <Input 
                id="endTime" 
                type="time" 
                className="bg-background border-input" 
                {...register('endTime', { required: true })} 
              />
            </div>
          </motion.div>
          
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={formAnimation}
            key="rate-field"
          >
            <Label htmlFor="hourlyRate" className="text-muted-foreground">Ставка (CZK/год)</Label>
            <Input 
              id="hourlyRate" 
              type="number" 
              className="bg-background border-input" 
              min="0"
              step="10"
              {...register('hourlyRate', { 
                required: true,
                valueAsNumber: true, 
                min: 0 
              })} 
            />
          </motion.div>
        
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Отменить
              </Button>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1"
              >
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-dark text-white"
                  disabled={updateEntryMutation.isPending}
                >
                  {updateEntryMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}