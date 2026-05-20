import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'outline' | 'pills' | 'underlined';
}

export default function Input({
  variant = 'outline',
  className = '',
  ...props
}: InputProps) {
  const getClassName = () => {
    if (className.includes('form-item-input')) {
      return `form-item-input ${className}`;
    }
    return `input-field ${className}`;
  };

  return (
    <input
      className={getClassName()}
      {...props}
    />
  );
}
