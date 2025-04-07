import { useState, createContext, useContext, ReactNode } from "react";

type ModalState = {
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isExportModalOpen: boolean;
  currentEntryId: number | null;
};

type ModalActions = {
  openAddModal: () => void;
  closeAddModal: () => void;
  openEditModal: (id: number) => void;
  closeEditModal: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
};

// Create a context for managing modal state
const ModalContext = createContext<(ModalState & ModalActions) | undefined>(undefined);

// Provider component for modal state management
export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);
  
  const openEditModal = (id: number) => {
    setCurrentEntryId(id);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => setIsEditModalOpen(false);
  
  const openExportModal = () => setIsExportModalOpen(true);
  const closeExportModal = () => setIsExportModalOpen(false);

  // Combine state and actions to provide through context
  const value = {
    isAddModalOpen,
    isEditModalOpen,
    isExportModalOpen,
    currentEntryId,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openExportModal,
    closeExportModal,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

// Hook for consuming modal context
export const useModals = () => {
  const context = useContext(ModalContext);
  
  if (context === undefined) {
    throw new Error("useModals must be used within a ModalProvider");
  }
  
  return context;
};
