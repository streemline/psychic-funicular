import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, parseISO, isBefore, subMonths } from "date-fns";

type ReportsProps = {
  path?: string;
};

const Reports = ({ path }: ReportsProps) => {
  const [timeRange, setTimeRange] = useState("last_6_months");
  
  // Fetch monthly reports
  const { data: monthlyReports = [], isLoading: isLoadingReports } = useQuery({
    queryKey: ["/api/monthly-reports"],
    staleTime: 300000 // 5 minutes
  });
  
  // Fetch time entries
  const { data: timeEntries = [], isLoading: isLoadingEntries } = useQuery({
    queryKey: ["/api/time-entries"],
    staleTime: 60000 // 1 minute
  });
  
  // Fetch projects for data categorization
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    staleTime: 300000 // 5 minutes
  });

  // Filter data based on selected time range
  const getFilteredReports = () => {
    const now = new Date();
    
    return monthlyReports.filter(report => {
      const reportDate = new Date(report.year, report.month - 1);
      
      if (timeRange === "last_3_months") {
        return isBefore(subMonths(now, 3), reportDate);
      } else if (timeRange === "last_6_months") {
        return isBefore(subMonths(now, 6), reportDate);
      } else if (timeRange === "last_year") {
        return isBefore(subMonths(now, 12), reportDate);
      }
      
      return true; // For "all_time"
    }).sort((a, b) => {
      // Sort by date (newest first)
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  };

  // Prepare data for monthly hours chart
  const monthlyHoursChartData = getFilteredReports().map(report => ({
    name: format(new Date(report.year, report.month - 1), 'MMM yyyy'),
    hours: parseFloat(report.hoursWorked),
    earnings: parseFloat(report.totalEarnings)
  }));

  // Prepare data for projects distribution chart
  const getProjectsDistribution = () => {
    // Create a map to hold the total hours per project
    const projectHours: Record<number, number> = {};
    
    // Sum up hours for each project
    timeEntries.forEach(entry => {
      const projectId = entry.projectId;
      if (!projectHours[projectId]) {
        projectHours[projectId] = 0;
      }
      projectHours[projectId] += parseFloat(entry.duration);
    });
    
    // Convert to array format for the chart
    return Object.entries(projectHours).map(([projectId, hours]) => {
      const project = projects.find(p => p.id === parseInt(projectId));
      return {
        name: project?.name || "Unknown",
        value: hours,
        color: project?.color || "#3b82f6"
      };
    });
  };

  const projectDistributionData = getProjectsDistribution();

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-primary-600 text-sm">
            {payload[0].name}: {payload[0].value.toFixed(1)} hours
          </p>
          {payload[1] && (
            <p className="text-accent-600 text-sm">
              {payload[1].name}: ${payload[1].value.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Overview Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading text-xl font-semibold text-gray-900">Reports Overview</h2>
          <div className="relative">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="last_year">Last Year</option>
              <option value="all_time">All Time</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <i className="ri-arrow-down-s-line"></i>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Hours</p>
                <h3 className="text-2xl font-semibold mt-1">
                  {monthlyReports.reduce((total, report) => total + parseFloat(report.hoursWorked), 0).toFixed(1)}h
                </h3>
              </div>
              <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                <i className="ri-time-line text-xl"></i>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Based on {getFilteredReports().length} monthly reports
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <h3 className="text-2xl font-semibold mt-1">
                  ${monthlyReports.reduce((total, report) => total + parseFloat(report.totalEarnings), 0).toFixed(2)}
                </h3>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <i className="ri-money-dollar-circle-line text-xl"></i>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Total earnings across all projects
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Daily Average</p>
                <h3 className="text-2xl font-semibold mt-1">
                  {monthlyReports.length > 0 
                    ? (monthlyReports.reduce((total, report) => total + parseFloat(report.dailyAverage), 0) / monthlyReports.length).toFixed(1) 
                    : 0}h
                </h3>
              </div>
              <div className="p-2 bg-accent-50 text-accent-600 rounded-lg">
                <i className="ri-bar-chart-line text-xl"></i>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Average hours worked per day
            </p>
          </div>
        </div>
      </section>
      
      {/* Monthly Hours Chart */}
      <section>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">Monthly Hours & Earnings</h3>
          
          {isLoadingReports ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : monthlyHoursChartData.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <div className="text-gray-400 text-4xl mb-2">
                <i className="ri-bar-chart-2-line"></i>
              </div>
              <p className="text-gray-600 mb-1">No data available for the selected time range</p>
              <p className="text-sm text-gray-500">Try selecting a different time range or add more time entries</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyHoursChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="hours" name="Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="earnings" name="Earnings" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
      
      {/* Project Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">Project Distribution</h3>
          
          {isLoadingEntries || isLoadingReports ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading project data...</p>
            </div>
          ) : projectDistributionData.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <div className="text-gray-400 text-4xl mb-2">
                <i className="ri-pie-chart-line"></i>
              </div>
              <p className="text-gray-600 mb-1">No project data available</p>
              <p className="text-sm text-gray-500">Add time entries to see project distribution</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {projectDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="mt-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Projects Legend</h4>
            <div className="grid grid-cols-2 gap-2">
              {projects.map(project => (
                <div key={project.id} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }}></span>
                  <span className="text-sm text-gray-600">{project.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">Work Efficiency</h3>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">Working Days per Month</span>
                <span className="text-sm font-medium text-gray-900">
                  {monthlyReports.length > 0 
                    ? Math.round(monthlyReports.reduce((total, report) => total + report.daysWorked, 0) / monthlyReports.length) 
                    : 0} days
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ 
                    width: `${monthlyReports.length > 0 
                      ? Math.min(100, (monthlyReports.reduce((total, report) => total + report.daysWorked, 0) / monthlyReports.length / 22) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Average across all monthly reports (standard: 22 days)</p>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">Hours per Working Day</span>
                <span className="text-sm font-medium text-gray-900">
                  {monthlyReports.length > 0 
                    ? (monthlyReports.reduce((total, report) => total + parseFloat(report.dailyAverage), 0) / monthlyReports.length).toFixed(1) 
                    : 0} hours
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-accent-600 h-2 rounded-full" 
                  style={{ 
                    width: `${monthlyReports.length > 0 
                      ? Math.min(100, (monthlyReports.reduce((total, report) => total + parseFloat(report.dailyAverage), 0) / monthlyReports.length / 8) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Average daily hours (standard: 8 hours)</p>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">Monthly Goal Completion</span>
                <span className="text-sm font-medium text-gray-900">
                  {monthlyReports.length > 0 
                    ? (((monthlyReports.reduce((total, report) => total + parseFloat(report.hoursWorked), 0) / monthlyReports.length) / 160) * 100).toFixed(0) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${monthlyReports.length > 0 
                      ? Math.min(100, ((monthlyReports.reduce((total, report) => total + parseFloat(report.hoursWorked), 0) / monthlyReports.length) / 160) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Average monthly hours vs. standard 160-hour goal</p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Reports;
