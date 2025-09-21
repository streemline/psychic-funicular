import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function SplashScreen() {
  const [, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Показываем контент с небольшой задержкой для плавности
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    // Переход к логину после задержки
    const navigationTimer = setTimeout(() => {
      setLocation('/auth');
    }, 2500);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(navigationTimer);
    };
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <img 
            src="/src/assets/logo_w.png" 
            alt="GENDAI Logo" 
            className="h-16 mx-auto"
          />
        </motion.div>

        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-xl md:text-2xl font-medium mt-4 mb-8 text-white">
              {t('splash_title')}
            </h1>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-2"
        >
          <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
        </motion.div>
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute bottom-4 text-center text-sm text-white/70"
      >
        © 2025 GENDAI, s.r.o. | {t('developed_by')}
      </motion.footer>
    </div>
  );
}