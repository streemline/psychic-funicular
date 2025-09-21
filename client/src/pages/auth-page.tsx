import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';

// Схема для формы входа
const loginSchema = z.object({
  username: z.string().min(3, { message: 'Имя пользователя должно содержать минимум 3 символа' }),
  password: z.string().min(6, { message: 'Пароль должен содержать минимум 6 символов' }),
});

// Схема для формы регистрации
const registerSchema = z.object({
  username: z.string().min(3, { message: 'Имя пользователя должно содержать минимум 3 символа' }),
  password: z.string().min(6, { message: 'Пароль должен содержать минимум 6 символов' }),
  fullName: z.string().min(2, { message: 'Введите ваше полное имя' }),
  email: z.string().email({ message: 'Введите корректный email адрес' }),
  position: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { t } = useTranslation();

  // Форма входа
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Форма регистрации
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      email: '',
      position: '',
    },
  });

  // Обработчик входа
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Успешный вход',
          description: 'Добро пожаловать в систему учета рабочего времени!',
        });
        setLocation('/');
      }
    });
  };

  // Обработчик регистрации
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Регистрация успешна',
          description: 'Ваша учетная запись была создана. Добро пожаловать!',
        });
        setLocation('/');
      }
    });
  };

  // Перенаправление если пользователь уже вошел
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Левая колонка - форма аутентификации */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <img src="/src/assets/logo_w.png" alt="GENDAI Logo" className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">{t('auth_title')}</h1>
            <p className="text-muted-foreground">{t('auth_subtitle')}</p>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">{t('login')}</TabsTrigger>
              <TabsTrigger value="register">{t('register')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('username')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('username_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('password_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? t('logging_in') : t('login')}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('username')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('username_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('password_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('full_name')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('full_name_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ivan@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Должность</FormLabel>
                        <FormControl>
                          <Input placeholder="Разработчик" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 GENDAI, s.r.o. | Developed by Mykola Yakubets
            </p>
          </div>
        </motion.div>
      </div>

      {/* Правая колонка - информация о приложении */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full md:w-1/2 bg-primary p-6 md:p-10 hidden md:flex items-center justify-center"
      >
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">Система учета рабочего времени</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-4 bg-white bg-opacity-20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"></path><path d="M12 14v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path><circle cx="12" cy="10" r="4"></circle></svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Отслеживание времени</h3>
                <p className="opacity-80">Ведите учет рабочего времени с точностью до минут</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 bg-white bg-opacity-20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2H6C4 2 3 3 3 5v14c0 2 1 3 3 3h12c2 0 3-1 3-3V5c0-2-1-3-3-3Z"></path><path d="M8 6h8"></path><path d="M8 10h8"></path><path d="M8 14h4"></path></svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Отчеты и статистика</h3>
                <p className="opacity-80">Получайте детальную статистику о вашем рабочем времени</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 bg-white bg-opacity-20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="m19.7 14.7-.2-1.4c-.1-.8.5-1.8 1.3-2.2.8-.4 1.3-1.5 1-2.3-.3-.8-1-1.6-1.8-1.6-.8-.1-1.7-.6-1.9-1.3-.2-.8-.9-1.5-1.8-1.5-.8 0-1.6.6-1.8 1.3-.2.8-1 1.4-1.8 1.4-.8 0-1.6.8-1.8 1.6-.2.8.1 1.8.9 2.2.8.4 1.5 1.3 1.4 2.2-.1.8-.4 1.8-1.2 2.1-.8.3-1.3 1.4-1.1 2.2.2.8 1 1.4 1.8 1.3.8-.1 1.7.3 2 1 .3.7 1 1.3 1.9 1.3.8 0 1.6-.5 2-1.2.3-.7 1.2-1.1 2-1.1"></path></svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Экспорт данных</h3>
                <p className="opacity-80">Экспортируйте данные в форматы PDF, Excel и CSV</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}