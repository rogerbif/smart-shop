import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Input from '../atoms/Input';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  variant?: 'login' | 'standard';
  error?: string | null;
}

export default function InputField({
  label,
  variant = 'standard',
  type = 'text',
  id,
  className = '',
  ...props
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  if (variant === 'login') {
    return (
      <div className="login-field-group">
        <label className="login-input-label" htmlFor={id}>
          {label}
        </label>
        <div className="login-input-wrapper">
          <Input
            type={resolvedType}
            id={id}
            className="login-input-field"
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Standard stacked field layout (used in custom lists, pantry items, etc.)
  return (
    <div className="input-group">
      <label className="input-label" htmlFor={id}>
        {label}
      </label>
      <Input
        type={resolvedType}
        id={id}
        className={className}
        {...props}
      />
    </div>
  );
}
