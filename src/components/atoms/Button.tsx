import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' | 'new-list';
  size?: 'sm' | 'md' | 'lg';
  isPending?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isPending = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  // Mapeamento de classes css baseado em variantes
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'danger':
        return 'btn-delete-item'; // Ou danger customizado
      case 'new-list':
        return 'btn-new-list';
      case 'ghost':
        return 'btn-ghost';
      default:
        return 'btn-primary';
    }
  };

  const getStyleOverrides = (): React.CSSProperties => {
    if (variant === 'danger') {
      return {
        backgroundColor: 'var(--danger-light, rgba(225, 45, 45, 0.1))',
        color: 'var(--danger, #e12d2d)',
        border: 'none',
        padding: '10px',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
      };
    }
    if (variant === 'ghost') {
      return {
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
    }
    return {};
  };

  return (
    <button
      type={type}
      disabled={disabled || isPending}
      className={`${getVariantClass()} ${className}`}
      style={getStyleOverrides()}
      {...props}
    >
      {isPending ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
          </svg>
          Processando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
