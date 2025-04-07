import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

// Схема для проверки пароля
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Поточний пароль є обов\'язковим'),
  newPassword: z.string().min(6, 'Новий пароль повинен містити щонайменше 6 символів'),
  confirmPassword: z.string().min(6, 'Підтвердження пароля є обов\'язковим'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { toast } = useToast();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string, newPassword: string }) => 
      apiRequest('PATCH', '/api/user/password', data),
    onSuccess: () => {
      toast({
        title: 'Пароль змінено',
        description: 'Ваш пароль успішно оновлено',
      });
      reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Помилка',
        description: `Не вдалось змінити пароль: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card max-w-md mx-auto">
        <DialogHeader className="bg-primary -mx-6 -mt-6 px-6 py-3 mb-4">
          <DialogTitle className="text-white">Зміна пароля</DialogTitle>
          <DialogDescription className="text-white/80 text-sm mt-1">
            Введіть ваш поточний пароль і новий пароль для зміни
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword" className="text-muted-foreground">Поточний пароль</Label>
            <div className="relative">
              <Input 
                id="currentPassword" 
                type={isPasswordVisible ? "text" : "password"} 
                className="bg-background border-input pr-10" 
                {...register('currentPassword')} 
              />
            </div>
            {errors.currentPassword && (
              <p className="text-destructive text-sm mt-1">{errors.currentPassword.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="newPassword" className="text-muted-foreground">Новий пароль</Label>
            <div className="relative">
              <Input 
                id="newPassword" 
                type={isPasswordVisible ? "text" : "password"} 
                className="bg-background border-input pr-10" 
                {...register('newPassword')} 
              />
            </div>
            {errors.newPassword && (
              <p className="text-destructive text-sm mt-1">{errors.newPassword.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="confirmPassword" className="text-muted-foreground">Підтвердіть новий пароль</Label>
            <div className="relative">
              <Input 
                id="confirmPassword" 
                type={isPasswordVisible ? "text" : "password"} 
                className="bg-background border-input pr-10" 
                {...register('confirmPassword')} 
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="showPassword" 
              className="rounded border-gray-300 text-primary focus:ring-primary"
              checked={isPasswordVisible}
              onChange={() => setIsPasswordVisible(!isPasswordVisible)}
            />
            <Label htmlFor="showPassword" className="text-sm font-normal">
              Показати паролі
            </Label>
          </div>
          
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Скасувати
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary hover:bg-primary-dark text-white"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? 'Збереження...' : 'Змінити пароль'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}