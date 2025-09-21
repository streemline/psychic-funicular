import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { getQueryFn } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@shared/schema';
import { useTranslation } from 'react-i18next';

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
  didNotWork: boolean; // Добавляем флаг "Не вышел на работу"
  dayOff: boolean; // Добавляем флаг "Выходной"
  businessTrip: boolean; // Добавляем флаг "Cesta"
}

export default function AddEntryModal({ open, onClose }: AddEntryModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currentEntryDate, setCurrentEntryDate] = useState<string>('');
  const [didNotWork, setDidNotWork] = useState(false);
  const [dayOff, setDayOff] = useState(false);
  const [businessTrip, setBusinessTrip] = useState(false);
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '18:00',
      hourlyRate: 190, // Значение по умолчанию для почасовой ставки в CZK
      notes: '',
      didNotWork: false,
      dayOff: false,
      businessTrip: false
    }
  });
  
  // Отслеживаем изменение флагов "Не вышел на работу" и "Выходной"
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'didNotWork') {
        setDidNotWork(!!value.didNotWork);
        // Если включили "Не вышел на работу", выключаем "Выходной" и "Cesta"
        if (!!value.didNotWork) {
          if (dayOff) {
            setValue('dayOff', false);
            setDayOff(false);
          }
          if (businessTrip) {
            setValue('businessTrip', false);
            setBusinessTrip(false);
          }
        }
      }
      if (name === 'dayOff') {
        setDayOff(!!value.dayOff);
        // Если включили "Выходной", выключаем "Не вышел на работу" и "Cesta"
        if (!!value.dayOff) {
          if (didNotWork) {
            setValue('didNotWork', false);
            setDidNotWork(false);
          }
          if (businessTrip) {
            setValue('businessTrip', false);
            setBusinessTrip(false);
          }
        }
      }
      if (name === 'businessTrip') {
        setBusinessTrip(!!value.businessTrip);
        // Если включили "Cesta", выключаем "Не вышел на работу" и "Выходной"
        if (!!value.businessTrip) {
          if (didNotWork) {
            setValue('didNotWork', false);
            setDidNotWork(false);
          }
          if (dayOff) {
            setValue('dayOff', false);
            setDayOff(false);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, didNotWork, dayOff, businessTrip]);
  
  const { data: user } = useQuery<User>({
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
    if (!user) {
      return;
    }
    
    // Преобразуем строку даты в объект Date с полуднем, чтобы избежать проблем с часовым поясом
    const formattedDate = `${data.date}T12:00:00.000Z`;
    setCurrentEntryDate(formattedDate);
    
    // Определяем специальные значения в зависимости от выбранных флагов
    let notesValue = data.notes;
    let startTimeValue = data.startTime;
    let endTimeValue = data.endTime;
    let hourlyRateValue = data.hourlyRate;
    
    if (data.didNotWork) {
      startTimeValue = "00:00";
      endTimeValue = "00:00";
      hourlyRateValue = 0;
      notesValue = "Nešel jsem do práce.";
    } else if (data.dayOff) {
      startTimeValue = "00:00";
      endTimeValue = "00:00";
      hourlyRateValue = 0;
      notesValue = "Volný den";
    } else if (data.businessTrip) {
      startTimeValue = "00:00";
      endTimeValue = "00:00";
      hourlyRateValue = 0;
      notesValue = "Cesta";
    }
    
    const entryData = {
      userId: user.id,
      date: formattedDate, // Отправляем как строку в формате ISO, Zod преобразует на стороне сервера
      startTime: startTimeValue,
      endTime: endTimeValue,
      hourlyRate: hourlyRateValue,
      notes: notesValue,
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
            <DialogTitle className="text-white">{t('add_entry')}</DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              {t('fill_fields')}
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
              <Label htmlFor="date" className="text-muted-foreground">{t('date')}</Label>
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
              key="didNotWork-field"
              className="flex items-center space-x-2"
            >
              <Checkbox 
                id="didNotWork" 
                checked={didNotWork}
                onCheckedChange={(checked) => {
                  setValue('didNotWork', checked === true);
                  setDidNotWork(checked === true);
                }}
                {...register('didNotWork')}
              />
              <Label htmlFor="didNotWork" className="text-muted-foreground font-medium">
                {t('did_not_work')}
              </Label>
            </motion.div>
            
            <motion.div
              custom={1.5}
              initial="hidden"
              animate="visible"
              variants={formAnimation}
              key="dayOff-field"
              className="flex items-center space-x-2"
            >
              <Checkbox 
                id="dayOff" 
                checked={dayOff}
                onCheckedChange={(checked) => {
                  setValue('dayOff', checked === true);
                  setDayOff(checked === true);
                }}
                {...register('dayOff')}
              />
              <Label htmlFor="dayOff" className="text-muted-foreground font-medium">
                {t('day_off')}
              </Label>
            </motion.div>
            
            <motion.div
              custom={1.7}
              initial="hidden"
              animate="visible"
              variants={formAnimation}
              key="businessTrip-field"
              className="flex items-center space-x-2"
            >
              <Checkbox 
                id="businessTrip" 
                checked={businessTrip}
                onCheckedChange={(checked) => {
                  setValue('businessTrip', checked === true);
                  setBusinessTrip(checked === true);
                }}
                {...register('businessTrip')}
              />
              <Label htmlFor="businessTrip" className="text-muted-foreground font-medium">
                {t('business_trip')}
              </Label>
            </motion.div>
            
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={formAnimation}
              key="notes-field"
            >
              <Label htmlFor="notes" className="text-muted-foreground">{t('action_name')}</Label>
              <Textarea 
                id="notes" 
                className="bg-background border-input h-20 resize-none" 
                disabled={didNotWork || dayOff || businessTrip}
                {...register('notes')} 
              />
            </motion.div>
            
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={formAnimation}
              className="grid grid-cols-2 gap-4"
              key="time-fields"
            >
              <div>
                <Label htmlFor="startTime" className="text-muted-foreground">{t('start')}</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  className="bg-background border-input" 
                  disabled={didNotWork || dayOff || businessTrip}
                  {...register('startTime', { required: !didNotWork && !dayOff && !businessTrip })} 
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-muted-foreground">{t('end')}</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  className="bg-background border-input" 
                  disabled={didNotWork || dayOff || businessTrip}
                  {...register('endTime', { required: !didNotWork && !dayOff && !businessTrip })} 
                />
              </div>
            </motion.div>
            
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={formAnimation}
              key="rate-field"
            >
              <Label htmlFor="hourlyRate" className="text-muted-foreground">{t('rate')}</Label>
              <Input 
                id="hourlyRate" 
                type="number" 
                className="bg-background border-input" 
                min="0"
                step="10"
                disabled={didNotWork || dayOff || businessTrip}
                {...register('hourlyRate', { 
                  required: !didNotWork && !dayOff && !businessTrip,
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
                {t('cancel')}
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
                  {addEntryMutation.isPending ? t('saving') : t('save')}
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
