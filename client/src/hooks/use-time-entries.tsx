import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { TimeEntry, InsertTimeEntry } from '@shared/schema';

export function useTimeEntries(year: number, month: number) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
  
  const { data: entries, isLoading, refetch } = useQuery({
    queryKey: [`/api/time-entries/${year}/${month}`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user,
  });
  
  const createEntry = useMutation({
    mutationFn: (entry: InsertTimeEntry) => apiRequest('POST', '/api/time-entries', entry),
    onSuccess: () => {
      // Обновляем данные записей времени
      queryClient.invalidateQueries({ queryKey: [`/api/time-entries/${year}/${month}`] });
      // Также обновляем ежемесячный отчет для корректного отображения отработанных часов
      queryClient.invalidateQueries({ queryKey: [`/api/monthly-reports/${year}/${month}`] });
      // И обновляем все отчеты
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-reports'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });
  
  const updateEntry = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertTimeEntry> }) => 
      apiRequest('PATCH', `/api/time-entries/${id}`, data),
    onSuccess: () => {
      // Обновляем данные записей времени
      queryClient.invalidateQueries({ queryKey: [`/api/time-entries/${year}/${month}`] });
      // Также обновляем ежемесячный отчет
      queryClient.invalidateQueries({ queryKey: [`/api/monthly-reports/${year}/${month}`] });
      // И обновляем все отчеты
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-reports'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });
  
  const deleteEntry = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/time-entries/${id}`),
    onSuccess: () => {
      // Обновляем данные записей времени
      queryClient.invalidateQueries({ queryKey: [`/api/time-entries/${year}/${month}`] });
      // Также обновляем ежемесячный отчет
      queryClient.invalidateQueries({ queryKey: [`/api/monthly-reports/${year}/${month}`] });
      // И обновляем все отчеты
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-reports'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });
  
  return {
    entries,
    isLoading,
    error,
    createEntry: createEntry.mutate,
    updateEntry: updateEntry.mutate,
    deleteEntry: deleteEntry.mutate,
    isPending: createEntry.isPending || updateEntry.isPending || deleteEntry.isPending,
  };
}
