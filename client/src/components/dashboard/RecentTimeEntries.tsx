import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type RecentTimeEntriesProps = {
  onEditEntry: (id: number) => void;
};

const RecentTimeEntries = ({ onEditEntry }: RecentTimeEntriesProps) => {
  const { toast } = useToast();
  
  // Fetch time entries
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ["/api/time-entries"],
    staleTime: 60000 // 1 minute
  });
  
  // Fetch projects for coloring
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    staleTime: 300000 // 5 minutes
  });

  // Delete time entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: "Entry deleted",
        description: "Time entry has been successfully removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not delete entry: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Handle delete entry
  const handleDeleteEntry = (id: number) => {
    if (window.confirm("Are you sure you want to delete this time entry? This action cannot be undone.")) {
      deleteEntryMutation.mutate(id);
    }
  };

  // Format date from ISO string to readable format
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  // Get project color
  const getProjectColor = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || "#3b82f6";
  };

  // Get project name
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  // Format time from 24h format to 12h format with AM/PM
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <section className="mb-8 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold text-gray-900">Recent Time Entries</h2>
        <a href="/time-entries" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
          View All <i className="ri-arrow-right-line"></i>
        </a>
      </div>
      
      <motion.div 
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading time entries...
                  </td>
                </tr>
              ) : timeEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No time entries found. Click "Add Time" to create one.
                  </td>
                </tr>
              ) : (
                timeEntries.slice(0, 5).map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: getProjectColor(entry.projectId) }}
                        ></span>
                        <span>{getProjectName(entry.projectId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parseFloat(entry.duration).toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ${parseFloat(entry.earnings).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="text-gray-500 hover:text-gray-700" 
                          onClick={() => onEditEntry(entry.id)}
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button 
                          className="text-gray-500 hover:text-red-600" 
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={deleteEntryMutation.isPending}
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {timeEntries.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(timeEntries.length, 5)}</span> of <span className="font-medium">{timeEntries.length}</span> entries
                </p>
              </div>
              {timeEntries.length > 5 && (
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Previous</span>
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-primary-50 text-sm font-medium text-primary-600">1</button>
                    {timeEntries.length > 5 && (
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">2</button>
                    )}
                    {timeEntries.length > 10 && (
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">3</button>
                    )}
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Next</span>
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default RecentTimeEntries;
