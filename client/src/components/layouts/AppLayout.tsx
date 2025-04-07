import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

type ModalHandlers = {
  openAddModal: () => void;
  openExportModal: () => void;
  openEditModal: (id: number) => void;
};

type AppLayoutProps = {
  children: ReactNode;
  modalHandlers: ModalHandlers;
};

const AppLayout = ({ children, modalHandlers }: AppLayoutProps) => {
  const [location] = useLocation();
  
  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    staleTime: 30000 // 30 seconds
  });
  
  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="bg-white border-r border-gray-200 w-full md:w-64 flex-shrink-0 flex flex-col">
        {/* Logo and App Name */}
        <div className="p-4 border-b flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
            <i className="ri-time-line text-lg"></i>
          </div>
          <h1 className="font-heading font-bold text-xl text-gray-900">TimeTrackPro</h1>
        </div>
        
        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-medium text-gray-500 mb-2 uppercase pl-2">Main</div>
          
          <Link href="/">
            <a className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              location === "/" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700 hover:bg-gray-100 transition-colors"
            }`}>
              <i className="ri-dashboard-line text-lg"></i>
              <span>Dashboard</span>
            </a>
          </Link>
          
          <Link href="/time-entries">
            <a className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              location === "/time-entries" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700 hover:bg-gray-100 transition-colors"
            }`}>
              <i className="ri-list-check text-lg"></i>
              <span>Time Entries</span>
            </a>
          </Link>
          
          <Link href="/reports">
            <a className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              location === "/reports" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700 hover:bg-gray-100 transition-colors"
            }`}>
              <i className="ri-file-chart-line text-lg"></i>
              <span>Reports</span>
            </a>
          </Link>
          
          <Link href="/calendar">
            <a className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              location === "/calendar" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700 hover:bg-gray-100 transition-colors"
            }`}>
              <i className="ri-calendar-line text-lg"></i>
              <span>Calendar</span>
            </a>
          </Link>
          
          <div className="text-xs font-medium text-gray-500 mt-6 mb-2 uppercase pl-2">Settings</div>
          
          <Link href="/profile">
            <a className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              location === "/profile" ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700 hover:bg-gray-100 transition-colors"
            }`}>
              <i className="ri-user-settings-line text-lg"></i>
              <span>Profile</span>
            </a>
          </Link>
        </nav>
        
        {/* User Profile Section */}
        <div className="p-4 border-t flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center">
            <span className="font-medium">{user?.initials || "AD"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{user?.name || "Alex Denova"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || "alex@example.com"}</p>
          </div>
          <button className="text-gray-600 hover:text-gray-900">
            <i className="ri-logout-box-line text-lg"></i>
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header with actions */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div>
            <h1 className="font-heading font-bold text-xl text-gray-900">
              {location === "/" ? "Dashboard" : 
               location === "/time-entries" ? "Time Entries" :
               location === "/reports" ? "Reports" :
               location === "/calendar" ? "Calendar" :
               location === "/profile" ? "Profile" : "Dashboard"}
            </h1>
            <p className="text-sm text-gray-500">Track and manage your working hours</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="mr-2">
              <button 
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={modalHandlers.openExportModal}>
                <i className="ri-download-line"></i>
                <span>Export</span>
              </button>
            </div>
            
            <button 
              className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 font-medium shadow-sm"
              onClick={modalHandlers.openAddModal}>
              <i className="ri-add-line"></i>
              <span>Add Time</span>
            </button>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <motion.div 
          className="flex-1 overflow-auto p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default AppLayout;
