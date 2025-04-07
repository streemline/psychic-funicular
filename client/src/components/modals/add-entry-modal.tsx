import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { getQueryFn } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';

interface AddEntryModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number; // Добавляем почасовую ставку
  notes: string;
}

export default function AddEntryModal({ open, onClose }: AddEntryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentEntryDate, setCurrentEntryDate] = useState<string>('');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '18:00',
      hourlyRate: 190, // Значение по умолчанию для почасовой ставки в CZK
      notes: '',
    }
  });
  
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
  
  const addEntryMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/time-entries', data),
    onSuccess: () => {
      toast({
        title: 'Запис збережено',
        description: 'Новий запис робочого часу успішно збережено',
      });
      
      // Получаем текущую дату из сохраненной переменной
      const currentDate = new Date(currentEntryDate || new Date());
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // Инвалидируем все необходимые запросы для обновления данных в различных компонентах
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      queryClient.invalidateQueries({ queryKey: [`/api/time-entries/${year}/${month}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/monthly-reports/${year}/${month}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-reports'] });
      
      reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Помилка',
        description: `Не вдалось зберегти запис: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: FormValues) => {
    if (!user) return;
    
    // Преобразуем строку даты в объект Date с полуднем, чтобы избежать проблем с часовым поясом
    const formattedDate = `${data.date}T12:00:00.000Z`;
    setCurrentEntryDate(formattedDate);
    
    const entryData = {
      userId: user.id,
      date: formattedDate, // Отправляем как строку в формате ISO, Zod преобразует на стороне сервера
      startTime: data.startTime,
      endTime: data.endTime,
      hourlyRate: data.hourlyRate,
      notes: data.notes,
    };
    
    console.log('Отправка данных:', entryData);
    addEntryMutation.mutate(entryData);
  };
  
  // Вариации анимации для элементов формы
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

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card max-w-md mx-auto">
        <DialogHeader className="bg-primary -mx-6 -mt-6 px-6 py-3 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <DialogTitle className="text-white">Додати новий запис</DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              Заповніть поля для створення нового запису робочого часу
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
                Скасувати
              </Button>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1"
              >
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-dark text-white"
                  disabled={addEntryMutation.isPending}
                >
                  {addEntryMutation.isPending ? 'Збереження...' : 'Зберегти'}
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
