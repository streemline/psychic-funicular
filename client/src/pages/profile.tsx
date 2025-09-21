import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { User } from '@shared/schema';
import ProfileImageUpload from '@/components/profile/profile-image-upload';
import ChangePasswordButton from '@/components/profile/change-password-button';
import LogoutButton from '@/components/profile/logout-button';
import LanguageSwitcher from '@/components/profile/language-switcher';
import { useTranslation } from 'react-i18next';
import { UserCircle } from 'lucide-react';

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Partial<User>>({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      position: user?.position || '',
    }
  });
  
  // Update form when user data is loaded
  React.useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName);
      setValue('email', user.email || '');
      setValue('phone', user.phone || '');
      setValue('position', user.position || '');
    }
  }, [user, setValue]);
  
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) => apiRequest('PATCH', '/api/user', data),
    onSuccess: () => {
      toast({
        title: 'Профіль оновлено',
        description: 'Ваші особисті дані успішно оновлено',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: 'Помилка',
        description: `Не вдалось оновити профіль: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: Partial<User>) => {
    updateProfileMutation.mutate(data);
  };
  
  if (isLoading) {
    return (
      <div className="px-4 py-6 pb-16 flex justify-center items-center min-h-[60vh]">
        <p>Завантаження даних профілю...</p>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-6 pb-24">
      <LanguageSwitcher />
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gray-200 mb-2 overflow-hidden">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={t('profile_image_alt')} className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="w-full h-full text-gray-400" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{user?.fullName}</h2>
        <p className="text-gray-500 text-sm mb-2">{user?.email}</p>
        <p className="text-gray-500 text-sm mb-2">{user?.position}</p>
        <span className="text-xs text-muted-foreground">{t('profile_note')}</span>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Personal Data */}
        <Card className="bg-card rounded-lg shadow-lg p-4 mb-4">
          <CardContent className="p-0">
            <h3 className="text-lg font-medium mb-4">Особисті дані</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-muted-foreground text-sm mb-1">Повне ім'я</Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  className="w-full bg-background border-input" 
                  {...register('fullName')}
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-muted-foreground text-sm mb-1">Електронна пошта</Label>
                <Input 
                  id="email" 
                  type="email" 
                  className="w-full bg-background border-input" 
                  {...register('email')}
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-muted-foreground text-sm mb-1">Телефон</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  className="w-full bg-background border-input" 
                  {...register('phone')}
                />
              </div>
              
              <div>
                <Label htmlFor="position" className="text-muted-foreground text-sm mb-1">Посада</Label>
                <Input 
                  id="position" 
                  type="text" 
                  className="w-full bg-background border-input" 
                  {...register('position')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary-dark text-white font-medium mb-4"
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? 'Збереження...' : 'Зберегти персональні дані'}
        </Button>
        
        {/* Account Actions */}
        <Card className="bg-card rounded-lg shadow-lg p-4 mb-4">
          <CardContent className="p-0">
            <h3 className="text-lg font-medium mb-4">Налаштування облікового запису</h3>
            
            <div className="space-y-4">
              <ChangePasswordButton />
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
