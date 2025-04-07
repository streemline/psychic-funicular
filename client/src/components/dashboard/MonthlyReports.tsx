import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

const MonthlyReports = () => {
  // Fetch monthly reports
  const { data: monthlyReports = [], isLoading } = useQuery({
    queryKey: ["/api/monthly-reports"],
    staleTime: 300000 // 5 minutes
  });

  // Format month and year
  const formatMonthYear = (year: number, month: number) => {
    // month is 1-indexed in our data but Date expects 0-indexed
    return format(new Date(year, month - 1), 'MMMM yyyy');
  };

  // Handle view details
  const handleViewMonthlyReport = (month: number, year: number) => {
    // In a real app, this would navigate to a detailed report page
    console.log(`Viewing report for ${month}/${year}`);
  };

  // Handle export
  const handleExportMonthlyReport = (month: number, year: number) => {
    // In a real app, this would trigger a download
    console.log(`Exporting report for ${month}/${year}`);
  };

  return (
    <section className="animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold text-gray-900">Monthly Reports</h2>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
            <i className="ri-filter-3-line"></i>
            <span>Filter</span>
          </button>
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <i className="ri-arrow-down-s-line"></i>
            </div>
          </div>
        </div>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Loading monthly reports...
          </div>
        ) : monthlyReports.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">
              <i className="ri-file-chart-line"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Monthly Reports Yet</h3>
            <p className="text-gray-500 mb-4">
              Monthly reports will be automatically generated as you track your time.
            </p>
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              Learn More About Reports
            </button>
          </div>
        ) : (
          // Map through the reports
          monthlyReports.map((report) => (
            <div 
              key={`${report.year}-${report.month}`} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-heading text-lg font-semibold text-gray-900">
                  {formatMonthYear(report.year, report.month)}
                </h3>
                <div className={`${
                  report.isCompleted 
                    ? "bg-green-50 text-green-700" 
                    : "bg-primary-50 text-primary-700"
                  } font-medium text-xs px-2 py-0.5 rounded-full`}>
                  {report.isCompleted ? "Completed" : "In Progress"}
                </div>
              </div>
              
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Hours Worked</span>
                  <span className="text-sm font-medium text-gray-900">{parseFloat(report.hoursWorked).toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Days Worked</span>
                  <span className="text-sm font-medium text-gray-900">{report.daysWorked} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Daily Average</span>
                  <span className="text-sm font-medium text-gray-900">{parseFloat(report.dailyAverage).toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="text-sm font-medium text-gray-900">${parseFloat(report.totalEarnings).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button 
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  onClick={() => handleViewMonthlyReport(report.month, report.year)}
                >
                  View Details
                </button>
                <button 
                  className="text-gray-600 hover:text-gray-900 text-sm"
                  onClick={() => handleExportMonthlyReport(report.month, report.year)}
                >
                  <i className="ri-download-line"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </motion.div>
    </section>
  );
};

export default MonthlyReports;
