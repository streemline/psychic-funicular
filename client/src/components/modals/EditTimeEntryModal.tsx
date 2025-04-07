import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Define validation schema
const timeEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  projectId: z.string().min(1, "Project is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  notes: z.string().optional(),
});

type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;

type EditTimeEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  entryId: number | null;
};

export const EditTimeEntryModal = ({ isOpen, onClose, entryId }: EditTimeEntryModalProps) => {
  const { toast } = useToast();
  
  // Get projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    staleTime: 300000 // 5 minutes
  });

  // Initialize form
  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: '',
      projectId: '',
      startTime: '',
      endTime: '',
      hourlyRate: '',
      notes: '',
    },
  });

  // Fetch time entry data when ID changes
  const { data: timeEntry, isLoading } = useQuery({
    queryKey: [`/api/time-entries/${entryId}`],
    enabled: isOpen && entryId !== null,
    staleTime: 60000 // 1 minute
  });

  // Fill form when time entry data is loaded
  useEffect(() => {
    if (timeEntry) {
      form.reset({
        date: timeEntry.date,
        projectId: timeEntry.projectId.toString(),
        startTime: timeEntry.startTime,
        endTime: timeEntry.endTime,
        hourlyRate: timeEntry.hourlyRate.toString(),
        notes: timeEntry.notes || '',
      });
    }
  }, [timeEntry, form]);

  // Update time entry mutation
  const updateTimeEntryMutation = useMutation({
    mutationFn: async (values: TimeEntryFormValues) => {
      if (!entryId) throw new Error("No entry ID provided");
      
      const response = await apiRequest("PATCH", `/api/time-entries/${entryId}`, {
        ...values,
        projectId: parseInt(values.projectId),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: [`/api/time-entries/${entryId}`] });
      toast({
        title: "Success",
        description: "Time entry has been updated",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update time entry: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: TimeEntryFormValues) => {
    updateTimeEntryMutation.mutate(values);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-heading text-lg font-semibold text-gray-900">Edit Time Entry</h3>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={onClose}
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="p-5">
              {isLoading ? (
                <div className="py-10 text-center text-gray-500">
                  Loading time entry data...
                </div>
              ) : !timeEntry ? (
                <div className="py-10 text-center text-gray-500">
                  Could not load time entry data
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">Date</label>
                      <input 
                        type="date" 
                        id="date"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        {...form.register("date")}
                      />
                      {form.formState.errors.date && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.date.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="projectId">Project</label>
                      <select 
                        id="projectId"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        {...form.register("projectId")}
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                      {form.formState.errors.projectId && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.projectId.message}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="startTime">Start Time</label>
                        <input 
                          type="time" 
                          id="startTime"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          {...form.register("startTime")}
                        />
                        {form.formState.errors.startTime && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.startTime.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="endTime">End Time</label>
                        <input 
                          type="time" 
                          id="endTime"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          {...form.register("endTime")}
                        />
                        {form.formState.errors.endTime && (
                          <p className="mt-1 text-sm text-red-600">{form.formState.errors.endTime.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="hourlyRate">Hourly Rate ($)</label>
                      <input 
                        type="number" 
                        id="hourlyRate"
                        min="0" 
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        {...form.register("hourlyRate")}
                      />
                      {form.formState.errors.hourlyRate && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.hourlyRate.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">Notes</label>
                      <textarea 
                        id="notes"
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Add any additional details here..."
                        {...form.register("notes")}
                      ></textarea>
                      {form.formState.errors.notes && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.notes.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button 
                      type="button" 
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
                      disabled={updateTimeEntryMutation.isPending}
                    >
                      {updateTimeEntryMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
