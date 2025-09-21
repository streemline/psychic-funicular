import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';

export default function LogoutButton() {
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  const { t } = useTranslation();
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'Вихід виконано',
          description: 'Ви успішно вийшли з системи',
        });
      },
      onError: (error) => {
        toast({
          title: 'Помилка',
          description: `Не вдалось вийти з системи: ${error}`,
          variant: 'destructive',
        });
      }
    });
  };
  
  return (
    <Button 
      type="button"
      variant="outline"
      className="flex items-center gap-2 w-full justify-center border-destructive text-destructive" 
      onClick={handleLogout}
    >
      <LogOut size={16} />
      <span>{t('logout')}</span>
    </Button>
  );
}