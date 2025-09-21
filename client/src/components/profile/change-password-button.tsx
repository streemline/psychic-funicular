import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import ChangePasswordModal from '../modals/change-password-modal';
import { useTranslation } from 'react-i18next';

export default function ChangePasswordButton() {
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <Button 
        type="button"
        variant="outline"
        className="flex items-center gap-2 w-full justify-center mb-2" 
        onClick={() => setIsChangePasswordModalOpen(true)}
      >
        <Lock size={16} />
        <span>{t('change_password')}</span>
      </Button>
      
      <ChangePasswordModal 
        open={isChangePasswordModalOpen} 
        onClose={() => setIsChangePasswordModalOpen(false)} 
      />
    </>
  );
}