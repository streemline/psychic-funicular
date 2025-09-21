import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3Icon, 
  PlusIcon, 
  UserIcon, 
  BellIcon, 
  Menu, 
  FileOutput
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  activePage: string;
  onNavigation: (page: string) => void;
  onAddEntry: () => void;
  onExport?: () => void;
}

export default function Navbar({ 
  activePage, 
  onNavigation, 
  onAddEntry,
  onExport 
}: NavbarProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Top Header */}
      <header className="bg-primary text-white py-3 px-4 flex justify-between items-center shadow-md">
        <button className="text-xl" onClick={() => {}}>
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-medium">Streemline</h1>
        <div className="flex space-x-4">
          {onExport && (
            <button className="text-xl" onClick={onExport}>
              <FileOutput className="h-6 w-6" />
            </button>
          )}
          <button className="text-xl">
            <BellIcon className="h-6 w-6" />
          </button>
          <button className="text-xl" onClick={() => onNavigation('profile')}>
            <UserIcon className="h-6 w-6" />
          </button>
        </div>
      </header>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-gray-700 px-2 py-3 flex justify-around z-10">
        <button 
          className={`flex flex-col items-center ${activePage === 'statistics' ? 'text-primary' : 'text-muted-foreground hover:text-primary transition-colors'}`}
          onClick={() => onNavigation('statistics')}
        >
          <BarChart3Icon className="h-6 w-6" />
          <span className="text-xs mt-1">{t('statistics')}</span>
        </button>
        
        <button 
          className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
          onClick={onAddEntry}
        >
          <div className="bg-primary w-12 h-12 rounded-full flex items-center justify-center text-white -mt-6">
            <PlusIcon className="h-6 w-6" />
          </div>
          <span className="text-xs mt-1">{t('add')}</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${activePage === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-primary transition-colors'}`}
          onClick={() => onNavigation('profile')}
        >
          <UserIcon className="h-6 w-6" />
          <span className="text-xs mt-1">{t('profile')}</span>
        </button>
      </nav>
    </>
  );
}
