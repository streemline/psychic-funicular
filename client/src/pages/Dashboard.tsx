import MonthlySummary from "@/components/dashboard/MonthlySummary";
import RecentTimeEntries from "@/components/dashboard/RecentTimeEntries";
import MonthlyReports from "@/components/dashboard/MonthlyReports";
import { useEffect } from "react";

type DashboardProps = {
  path?: string;
};

const Dashboard = ({ path }: DashboardProps) => {
  // Get edit entry handler from parent App component
  const onEditEntry = (id: number) => {
    // This would typically be passed down via props or context
    // For this example, we can access it from the window object
    // In a real app, you would use a proper state management approach
    if (window.app && window.app.modalHandlers) {
      window.app.modalHandlers.openEditModal(id);
    }
  };

  // Add app handlers to window for access by child components
  useEffect(() => {
    // This is a workaround for passing handlers to child components
    // In a real app, you would use context or proper prop drilling
    window.app = {
      modalHandlers: {
        openEditModal: (id: number) => {
          const event = new CustomEvent('openEditModal', { detail: { id } });
          window.dispatchEvent(event);
        }
      }
    };

    // Listen for custom events
    const handleEditModal = (e: Event) => {
      const customEvent = e as CustomEvent;
      const id = customEvent.detail.id;
      onEditEntry(id);
    };

    window.addEventListener('openEditModal', handleEditModal);

    return () => {
      window.removeEventListener('openEditModal', handleEditModal);
      delete window.app;
    };
  }, []);

  return (
    <>
      <MonthlySummary />
      <RecentTimeEntries onEditEntry={onEditEntry} />
      <MonthlyReports />
    </>
  );
};

// Add window app declaration for TypeScript
declare global {
  interface Window {
    app?: {
      modalHandlers: {
        openEditModal: (id: number) => void;
      };
    };
  }
}

export default Dashboard;
