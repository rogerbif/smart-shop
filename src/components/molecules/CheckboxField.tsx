import React from 'react';

interface CheckboxFieldProps {
  checked: boolean;
  onChange: () => void;
  variant?: 'square' | 'circle';
  label?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function CheckboxField({
  checked,
  onChange,
  variant = 'square',
  label,
  description,
  className = '',
  style
}: CheckboxFieldProps) {
  const isCircle = variant === 'circle';
  
  const indicatorClass = isCircle ? 'item-checkbox' : 'checkbox-custom';

  const getIndicatorStyle = (): React.CSSProperties => {
    if (isCircle) return {};
    return {
      backgroundColor: checked ? 'var(--primary)' : 'transparent',
      borderColor: checked ? 'var(--primary)' : 'var(--border-color)',
    };
  };

  return (
    <div 
      className={className} 
      onClick={onChange}
      style={{ cursor: 'pointer', ...style }}
    >
      <div 
        className={indicatorClass} 
        style={getIndicatorStyle()}
        role="checkbox"
        aria-checked={checked}
      >
        {checked && (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && <span>{label}</span>}
          {description && <span>{description}</span>}
        </div>
      )}
    </div>
  );
}
