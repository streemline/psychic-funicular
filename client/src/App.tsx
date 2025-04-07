import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AddTimeEntryModal } from "@/components/modals/AddTimeEntryModal";
import { EditTimeEntryModal } from "@/components/modals/EditTimeEntryModal";
import { ExportDataModal } from "@/components/modals/ExportDataModal";
import AppLayout from "@/components/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import TimeEntries from "@/pages/TimeEntries";
import Reports from "@/pages/Reports";
import Calendar from "@/pages/Calendar";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function App() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);
  
  // Define modal handlers to be passed down to components
  const modalHandlers = {
    openAddModal: () => setIsAddModalOpen(true),
    closeAddModal: () => setIsAddModalOpen(false),
    openEditModal: (id: number) => {
      setCurrentEntryId(id);
      setIsEditModalOpen(true);
    },
    closeEditModal: () => setIsEditModalOpen(false),
    openExportModal: () => setIsExportModalOpen(true),
    closeExportModal: () => setIsExportModalOpen(false)
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout modalHandlers={modalHandlers}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/time-entries" component={TimeEntries} />
          <Route path="/reports" component={Reports} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
      
      {/* Modals */}
      <AddTimeEntryModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      <EditTimeEntryModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        entryId={currentEntryId} 
      />
      
      <ExportDataModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
      
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
