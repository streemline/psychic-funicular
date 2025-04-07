import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  textClassName?: string;
}

export function ProgressCircle({
  percentage,
  size = 120,
  strokeWidth = 8,
  className,
  textClassName
}: ProgressCircleProps) {
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedPercentage / 100) * circumference;
  
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="transparent" 
          stroke="hsl(var(--secondary))" 
          strokeWidth={strokeWidth} 
        />
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          fill="transparent" 
          stroke="hsl(var(--primary))" 
          strokeWidth={strokeWidth} 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-xl font-bold", textClassName)}>
          {Math.round(normalizedPercentage)}%
        </span>
      </div>
    </div>
  );
}
