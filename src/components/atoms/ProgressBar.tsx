import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  variant?: 'primary' | 'budget';
}

export default function ProgressBar({
  value,
  variant = 'primary'
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const containerClass = variant === 'budget' ? 'budget-progress-container' : 'progress-bar-container';
  const fillClass = variant === 'budget' ? 'budget-progress-fill' : 'progress-bar-fill';

  return (
    <div className={containerClass}>
      <div 
        className={fillClass} 
        style={{ width: `${clampedValue}%` }}
      ></div>
    </div>
  );
}
