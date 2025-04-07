import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedEntryProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  index?: number;
}

export function AnimatedEntry({
  children,
  className,
  delay = 0,
  index = 0
}: AnimatedEntryProps) {
  const hasAnimated = useRef(false);
  
  // We animate only on first render
  const shouldAnimate = !hasAnimated.current;
  
  useEffect(() => {
    hasAnimated.current = true;
  }, []);
  
  return (
    <AnimatePresence>
      <motion.div
        className={cn(className)}
        initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
          delay: delay + (index * 0.05) // Staggered animation based on index
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function AnimatedEntryRow({
  children,
  className,
  delay = 0,
  index = 0
}: AnimatedEntryProps) {
  const hasAnimated = useRef(false);
  
  // We animate only on first render
  const shouldAnimate = !hasAnimated.current;
  
  useEffect(() => {
    hasAnimated.current = true;
  }, []);
  
  return (
    <AnimatePresence>
      <motion.tr
        className={cn(className)}
        initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
          delay: delay + (index * 0.05) // Staggered animation based on index
        }}
      >
        {children}
      </motion.tr>
    </AnimatePresence>
  );
}

export function AnimatedFade({
  children,
  className,
  delay = 0
}: AnimatedEntryProps) {
  return (
    <AnimatePresence>
      <motion.div
        className={cn(className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.5,
          delay
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}