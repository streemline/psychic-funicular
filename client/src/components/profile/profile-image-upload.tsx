import React, { useState, useRef } from 'react';
import { User } from '@shared/schema';
import { UserIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProfileImageUploadProps {
  user: User | null;
}

export default function ProfileImageUpload({ user }: ProfileImageUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImage || null);

  const updateProfileImageMutation = useMutation({
    mutationFn: (data: { profileImage: string }) => apiRequest('PATCH', '/api/user', data),
    onSuccess: () => {
      toast({
        title: 'Фото профілю оновлено',
        description: 'Ваше фото профілю успішно оновлено',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error) => {
      toast({
        title: 'Помилка',
        description: `Не вдалось оновити фото профілю: ${error}`,
        variant: 'destructive',
      });
    }
  });

  // Функция для сжатия изображения перед отправкой
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          // Максимальные размеры для фото профиля
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          
          let width = img.width;
          let height = img.height;
          
          // Уменьшаем размеры, сохраняя пропорции
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Сжимаем в формат JPEG с качеством 0.8
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Ошибка при загрузке изображения'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Ошибка при чтении файла'));
      };
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка размера файла (макс. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Помилка',
        description: 'Розмір файлу занадто великий. Максимум 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, оберіть файл зображення.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Показываем предварительный просмотр до завершения сжатия
      const reader = new FileReader();
      reader.onload = (e) => {
        const originalDataUrl = e.target?.result as string;
        setPreviewUrl(originalDataUrl);
      };
      reader.readAsDataURL(file);

      // Сжимаем изображение
      const compressedDataUrl = await compressImage(file);
      
      // Обновляем предварительный просмотр и отправляем на сервер
      setPreviewUrl(compressedDataUrl);
      updateProfileImageMutation.mutate({ profileImage: compressedDataUrl });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Помилка при обробці зображення',
        variant: 'destructive',
      });
      console.error('Error processing image:', error);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    updateProfileImageMutation.mutate({ profileImage: '' });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary overflow-hidden">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Фото профілю" 
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon size={48} />
          )}
          
          {updateProfileImageMutation.isPending && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        <div className="flex mt-2 justify-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="rounded-full h-8 w-8 p-0"
            onClick={handleUploadClick}
            title="Завантажити фото"
          >
            <Upload size={16} />
          </Button>
          
          {previewUrl && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="rounded-full h-8 w-8 p-0 border-destructive text-destructive"
              onClick={handleRemoveImage}
              title="Видалити фото"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />
    </div>
  );
}