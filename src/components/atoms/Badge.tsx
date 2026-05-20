import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'personal' | 'shared' | 'cheio' | 'baixo' | 'em-falta' | 'default';
}

export default function Badge({
  variant,
  children,
  className = '',
  ...props
}: BadgeProps) {
  const getBadgeClass = () => {
    switch (variant) {
      case 'personal':
        return 'badge-context personal';
      case 'shared':
        return 'badge-context shared';
      case 'cheio':
        return 'pantry-badge cheio';
      case 'baixo':
        return 'pantry-badge baixo';
      case 'em-falta':
        return 'pantry-badge em-falta';
      default:
        return 'badge-context';
    }
  };

  return (
    <span className={`${getBadgeClass()} ${className}`} {...props}>
      {children}
    </span>
  );
}
