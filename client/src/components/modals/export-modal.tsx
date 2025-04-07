import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { exportTimeTracking } from '@/utils/export';
import { TimeEntry, MonthlyReport, User } from '@shared/schema';
import { motion } from 'framer-motion';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  entries: TimeEntry[];
  monthlyReport: MonthlyReport;
  year: number;
  month: number;
}

export default function ExportModal({ 
  open, 
  onClose, 
  user, 
  entries, 
  monthlyReport,
  year,
  month
}: ExportModalProps) {
  const { toast } = useToast();
  const [fileFormat, setFileFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [filename, setFilename] = useState<string>(`Výkaz_práce_${month}_${year}`);
  const [isExporting, setIsExporting] = useState(false);
  
  const [options, setOptions] = useState({
    includeProfile: true,
    includeNotes: true,
    includeSalary: true,
    includeProjects: false,
    includeActions: false,
  });
  
  const handleOptionChange = (option: keyof typeof options) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportTimeTracking(
        fileFormat, 
        user, 
        entries, 
        monthlyReport, 
        options,
        filename
      );
      
      toast({
        title: 'Експорт завершено',
        description: `Файл ${filename}.${fileFormat} був успішно згенерований`
      });
      
      onClose();
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      toast({
        title: 'Помилка експорту',
        description: `Не вдалося створити файл експорту: ${error instanceof Error ? error.message : 'Невідома помилка'}`,
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const formAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.1,
        duration: 0.3,
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
            <DialogTitle className="text-white">Експорт даних</DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              Експорт робочого часу у формат файлу на вибір
            </DialogDescription>
          </motion.div>
        </DialogHeader>
        
        <div className="space-y-4">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={formAnimation}
          >
            <Label htmlFor="fileFormat" className="text-muted-foreground">Формат файлу</Label>
            <Select 
              value={fileFormat} 
              onValueChange={(value) => setFileFormat(value as 'pdf' | 'excel' | 'csv')}
            >
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Оберіть формат файлу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
          
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={formAnimation}
          >
            <Label htmlFor="filename" className="text-muted-foreground">Ім'я файлу</Label>
            <Input 
              id="filename" 
              type="text" 
              className="bg-background border-input" 
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </motion.div>
          
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={formAnimation}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="includeProfile">Включити інформацію профілю</Label>
              <Switch 
                id="includeProfile" 
                checked={options.includeProfile}
                onCheckedChange={() => handleOptionChange('includeProfile')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="includeNotes">Включити примітки</Label>
              <Switch 
                id="includeNotes" 
                checked={options.includeNotes}
                onCheckedChange={() => handleOptionChange('includeNotes')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="includeSalary">Включити заробітну плату</Label>
              <Switch 
                id="includeSalary" 
                checked={options.includeSalary}
                onCheckedChange={() => handleOptionChange('includeSalary')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="includeProjects">Включити проекти</Label>
              <Switch 
                id="includeProjects" 
                checked={options.includeProjects}
                onCheckedChange={() => handleOptionChange('includeProjects')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="includeActions">Включити дії</Label>
              <Switch 
                id="includeActions" 
                checked={options.includeActions}
                onCheckedChange={() => handleOptionChange('includeActions')}
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isExporting}>
                Скасувати
              </Button>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1"
              >
                <Button 
                  type="button" 
                  className="w-full bg-primary hover:bg-primary-dark text-white"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? 'Експорт...' : 'Експортувати'}
                </Button>
              </motion.div>
            </DialogFooter>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
