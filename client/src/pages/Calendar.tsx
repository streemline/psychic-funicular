import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isWeekend
} from "date-fns";
import { motion } from "framer-motion";

type CalendarProps = {
  path?: string;
};

const Calendar = ({ path }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
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

  // Helper to get entries for a specific day
  const getEntriesForDay = (day: Date) => {
    return timeEntries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isSameDay(entryDate, day);
    });
  };

  // Calculate total hours worked on a specific day
  const getHoursForDay = (day: Date) => {
    const entries = getEntriesForDay(day);
    return entries.reduce((total, entry) => total + parseFloat(entry.duration), 0);
  };

  // Get intensity color based on hours worked
  const getIntensityColor = (hours: number) => {
    if (hours === 0) return "bg-gray-100";
    if (hours < 2) return "bg-primary-100";
    if (hours < 4) return "bg-primary-200";
    if (hours < 6) return "bg-primary-300";
    if (hours < 8) return "bg-primary-400";
    return "bg-primary-600";
  };

  // Get project color
  const getProjectColor = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || "#3b82f6";
  };

  // Format time from 24h format to 12h format with AM/PM
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Navigate to current month
  const currentMonthHandler = () => {
    setCurrentMonth(new Date());
  };

  // Generate days for the calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day name headers (Mon, Tue, Wed, etc.)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Calendar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-gray-900">Time Tracking Calendar</h2>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={prevMonth}
              className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            
            <button 
              onClick={currentMonthHandler}
              className="px-3 py-1.5 rounded-md bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100"
            >
              Today
            </button>
            
            <button 
              onClick={nextMonth}
              className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
            
            <span className="text-lg font-medium text-gray-800 ml-2">
              {format(currentMonth, "MMMM yyyy")}
            </span>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div 
                key={day} 
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-start-${i}`} className="aspect-square"></div>
            ))}
            
            {days.map(day => {
              const hours = getHoursForDay(day);
              const dayEntries = getEntriesForDay(day);
              const isCurrentDay = isSameDay(day, new Date());
              
              return (
                <div 
                  key={day.toString()} 
                  className={`
                    aspect-square border ${isCurrentDay ? 'border-primary-500' : 'border-gray-200'} 
                    rounded-md overflow-hidden ${isWeekend(day) ? 'bg-gray-50' : ''}
                  `}
                >
                  <div className="h-full flex flex-col">
                    {/* Day header */}
                    <div className={`
                      ${getIntensityColor(hours)} p-1 text-right text-xs font-medium
                      ${hours > 4 ? 'text-white' : 'text-gray-800'}
                    `}>
                      {format(day, "d")}
                      {hours > 0 && <span className="ml-1">{hours}h</span>}
                    </div>
                    
                    {/* Day entries */}
                    <div className="p-1 flex-1 overflow-y-auto">
                      {dayEntries.slice(0, 2).map(entry => (
                        <div 
                          key={entry.id} 
                          className="mb-1 text-xs border-l-2 pl-1" 
                          style={{ borderColor: getProjectColor(entry.projectId) }}
                        >
                          <div className="font-medium truncate">
                            {projects.find(p => p.id === entry.projectId)?.name}
                          </div>
                          <div className="text-gray-500">
                            {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                          </div>
                        </div>
                      ))}
                      
                      {dayEntries.length > 2 && (
                        <div className="text-xs text-center text-gray-500 mt-1">
                          +{dayEntries.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {Array.from({ length: (7 - (days.length + monthStart.getDay()) % 7) % 7 }).map((_, i) => (
              <div key={`empty-end-${i}`} className="aspect-square"></div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Daily View for Current Day */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">
          Today's Schedule: {format(new Date(), "EEEE, MMMM d, yyyy")}
        </h3>
        
        {isLoading ? (
          <div className="py-10 text-center text-gray-500">
            Loading schedule...
          </div>
        ) : (
          <div>
            <div className="border-l-2 border-primary-500 pl-4 ml-3 space-y-6 relative">
              {getEntriesForDay(new Date()).length > 0 ? (
                getEntriesForDay(new Date()).map(entry => {
                  const project = projects.find(p => p.id === entry.projectId);
                  
                  return (
                    <div key={entry.id} className="relative">
                      {/* Time marker */}
                      <div className="absolute -left-[21px] top-0 h-4 w-4 rounded-full border-2 border-white" style={{ backgroundColor: project?.color || "#3b82f6" }}></div>
                      
                      <div className="mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({parseFloat(entry.duration).toFixed(1)}h)
                        </span>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900 mb-1">{project?.name || "Unknown Project"}</h4>
                          <p className="text-sm text-gray-600">{entry.notes || "No notes"}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">${parseFloat(entry.earnings).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">at ${parseFloat(entry.hourlyRate).toFixed(2)}/hr</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <div className="text-gray-400 text-4xl mb-2">
                    <i className="ri-calendar-event-line"></i>
                  </div>
                  <p className="text-gray-600 mb-1">No time entries for today</p>
                  <button className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1 mx-auto">
                    <i className="ri-add-line"></i> Add Time Entry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default Calendar;
