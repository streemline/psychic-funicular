import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

type ExportDataModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ExportFormValues = {
  exportFormat: "pdf" | "excel" | "csv";
  dateRange: string;
  startDate?: string;
  endDate?: string;
  includeTimeEntries: boolean;
  includeMonthlyReport: boolean;
  includeCharts: boolean;
};

export const ExportDataModal = ({ isOpen, onClose }: ExportDataModalProps) => {
  const { toast } = useToast();
  const [showCustomDate, setShowCustomDate] = useState(false);
  
  // Initialize form
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExportFormValues>({
    defaultValues: {
      exportFormat: "pdf",
      dateRange: "current_month",
      includeTimeEntries: true,
      includeMonthlyReport: true,
      includeCharts: true,
    }
  });
  
  // Watch date range to show/hide custom date inputs
  const dateRange = watch("dateRange");
  
  // Update custom date visibility when date range changes
  useState(() => {
    setShowCustomDate(dateRange === "custom");
  });
  
  // Handle export
  const onSubmit = (data: ExportFormValues) => {
    // In a real app, this would trigger an actual export
    console.log("Exporting data:", data);
    
    toast({
      title: `Your ${data.exportFormat.toUpperCase()} export is ready`,
      description: "The file has been downloaded to your device.",
    });
    
    onClose();
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
              <h3 className="font-heading text-lg font-semibold text-gray-900">Export Data</h3>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={onClose}
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                    <div className="grid grid-cols-3 gap-3">
                      <label className={`flex flex-col items-center p-3 border ${
                        watch('exportFormat') === 'pdf' ? 'border-red-500' : 'border-gray-300'
                      } rounded-md cursor-pointer hover:bg-gray-50`}>
                        <input 
                          type="radio" 
                          value="pdf" 
                          className="sr-only"
                          {...register("exportFormat")}
                        />
                        <i className="ri-file-pdf-2-line text-red-500 text-2xl mb-1"></i>
                        <span className="text-sm font-medium text-gray-700">PDF</span>
                        <div className={`w-full h-1 ${
                          watch('exportFormat') === 'pdf' ? 'bg-red-500' : 'bg-transparent'
                        } rounded-full mt-2`}></div>
                      </label>
                      
                      <label className={`flex flex-col items-center p-3 border ${
                        watch('exportFormat') === 'excel' ? 'border-green-600' : 'border-gray-300'
                      } rounded-md cursor-pointer hover:bg-gray-50`}>
                        <input 
                          type="radio" 
                          value="excel" 
                          className="sr-only"
                          {...register("exportFormat")}
                        />
                        <i className="ri-file-excel-2-line text-green-600 text-2xl mb-1"></i>
                        <span className="text-sm font-medium text-gray-700">Excel</span>
                        <div className={`w-full h-1 ${
                          watch('exportFormat') === 'excel' ? 'bg-green-600' : 'bg-transparent'
                        } rounded-full mt-2`}></div>
                      </label>
                      
                      <label className={`flex flex-col items-center p-3 border ${
                        watch('exportFormat') === 'csv' ? 'border-blue-500' : 'border-gray-300'
                      } rounded-md cursor-pointer hover:bg-gray-50`}>
                        <input 
                          type="radio" 
                          value="csv" 
                          className="sr-only"
                          {...register("exportFormat")}
                        />
                        <i className="ri-file-text-line text-blue-500 text-2xl mb-1"></i>
                        <span className="text-sm font-medium text-gray-700">CSV</span>
                        <div className={`w-full h-1 ${
                          watch('exportFormat') === 'csv' ? 'bg-blue-500' : 'bg-transparent'
                        } rounded-full mt-2`}></div>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <select 
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      {...register("dateRange")}
                      onChange={(e) => {
                        setShowCustomDate(e.target.value === "custom");
                      }}
                    >
                      <option value="current_month">Current Month</option>
                      <option value="previous_month">Previous Month</option>
                      <option value="last_3_months">Last 3 Months</option>
                      <option value="last_6_months">Last 6 Months</option>
                      <option value="year_to_date">Year to Date</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  
                  {showCustomDate && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="startDate">Start Date</label>
                        <input 
                          type="date" 
                          id="startDate"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          {...register("startDate", { 
                            required: dateRange === "custom" ? "Start date is required" : false 
                          })}
                        />
                        {errors.startDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="endDate">End Date</label>
                        <input 
                          type="date" 
                          id="endDate"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          {...register("endDate", { 
                            required: dateRange === "custom" ? "End date is required" : false 
                          })}
                        />
                        {errors.endDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Include Data</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="includeTimeEntries"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          {...register("includeTimeEntries")}
                        />
                        <label htmlFor="includeTimeEntries" className="ml-2 block text-sm text-gray-700">Time Entries</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="includeMonthlyReport"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          {...register("includeMonthlyReport")}
                        />
                        <label htmlFor="includeMonthlyReport" className="ml-2 block text-sm text-gray-700">Monthly Summary</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="includeCharts"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          {...register("includeCharts")}
                        />
                        <label htmlFor="includeCharts" className="ml-2 block text-sm text-gray-700">Charts and Visualizations</label>
                      </div>
                    </div>
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
                  >
                    Export
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
