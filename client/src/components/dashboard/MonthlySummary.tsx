import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, getDaysInMonth, getDate } from "date-fns";

const MonthlySummary = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Fetch time entries for the current month
  const { data: timeEntries = [] } = useQuery({
    queryKey: [`/api/time-entries/${currentYear}/${currentMonth}`],
    staleTime: 60000 // 1 minute
  });
  
  // Fetch monthly report if available
  const { data: monthlyReport } = useQuery({
    queryKey: [`/api/monthly-reports/${currentYear}/${currentMonth}`],
    staleTime: 60000 // 1 minute
  });
  
  // Calculate monthly statistics
  const totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.duration), 0);
  const totalEarnings = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.earnings), 0);
  
  // Calculate days left in month
  const daysInMonth = getDaysInMonth(currentDate);
  const currentDay = getDate(currentDate);
  const daysLeft = daysInMonth - currentDay;
  
  // Calculate month progress percentage
  const progressPercentage = Math.min(100, Math.round((currentDay / daysInMonth) * 100));
  
  // Format total hours as 115h 20m
  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };
  
  return (
    <section className="mb-8 animate-fade-in">
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Current Month Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 col-span-1 lg:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-heading text-lg font-semibold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h3>
              <p className="text-sm text-gray-500">Current month progress</p>
            </div>
            <div className="bg-primary-50 text-primary-700 font-medium text-sm px-2.5 py-1 rounded-full">
              <span>{daysLeft} days left</span>
            </div>
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-gray-600">Monthly Goal</span>
              <span className="text-sm font-medium text-gray-900">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-sm mb-1">Hours Worked</div>
              <div className="text-xl font-semibold">{formatDuration(totalHours || 0)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500 text-sm mb-1">Earnings</div>
              <div className="text-xl font-semibold">${totalEarnings.toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-heading text-base font-semibold text-gray-900 mb-4">Weekly Stats</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="text-sm font-medium text-gray-900">24h 45m</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-accent-500 h-2 rounded-full" style={{ width: "65%" }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Last Week</span>
                <span className="text-sm font-medium text-gray-900">32h 10m</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-accent-300 h-2 rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Daily Average</span>
                <span className="text-sm font-medium text-gray-900">4.9h</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-heading text-base font-semibold text-gray-900 mb-4">Working Days</h3>
          
          <div className="flex flex-col h-[calc(100%-2rem)] justify-between">
            <div className="grid grid-cols-7 gap-1 text-center">
              <div className="text-xs text-gray-500">M</div>
              <div className="text-xs text-gray-500">T</div>
              <div className="text-xs text-gray-500">W</div>
              <div className="text-xs text-gray-500">T</div>
              <div className="text-xs text-gray-500">F</div>
              <div className="text-xs text-gray-500">S</div>
              <div className="text-xs text-gray-500">S</div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mt-2">
              {/* Mock calendar heatmap - in a real app this would be dynamic */}
              <div className="aspect-square rounded bg-primary-200"></div>
              <div className="aspect-square rounded bg-primary-500"></div>
              <div className="aspect-square rounded bg-primary-300"></div>
              <div className="aspect-square rounded bg-primary-400"></div>
              <div className="aspect-square rounded bg-primary-600"></div>
              <div className="aspect-square rounded bg-primary-100"></div>
              <div className="aspect-square rounded bg-gray-200"></div>
              
              <div className="aspect-square rounded bg-primary-300"></div>
              <div className="aspect-square rounded bg-primary-500"></div>
              <div className="aspect-square rounded bg-primary-400"></div>
              <div className="aspect-square rounded bg-primary-600"></div>
              <div className="aspect-square rounded bg-primary-500"></div>
              <div className="aspect-square rounded bg-gray-200"></div>
              <div className="aspect-square rounded bg-gray-200"></div>
              
              <div className="aspect-square rounded bg-primary-400"></div>
              <div className="aspect-square rounded bg-primary-300"></div>
              <div className="aspect-square rounded bg-primary-600"></div>
              <div className="aspect-square rounded bg-primary-400"></div>
              <div className="aspect-square rounded bg-primary-300"></div>
              <div className="aspect-square rounded bg-gray-200"></div>
              <div className="aspect-square rounded bg-gray-200"></div>
            </div>
            
            <div className="mt-3 flex items-center text-xs text-gray-500 justify-between">
              <span>Less</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded bg-gray-200"></div>
                <div className="w-3 h-3 rounded bg-primary-100"></div>
                <div className="w-3 h-3 rounded bg-primary-300"></div>
                <div className="w-3 h-3 rounded bg-primary-500"></div>
                <div className="w-3 h-3 rounded bg-primary-600"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default MonthlySummary;
