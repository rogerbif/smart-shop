'use client';

import { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { logout, User } from '@/lib/actions';

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="icon-button menu-toggle" aria-label="Menu principal">
          <Menu size={24} />
        </button>
      </div>

      <div className="header-center">
        <div className="app-brand">
          <div className="logo-icon-container">
            {/* SVG customizado de acordo com o PRD */}
            <svg viewBox="0 0 24 24" className="brand-logo-svg" width="28" height="28">
              <path d="M17 18c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM7 18c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-1.6-4.1l.1-.2h12.5c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2z" fill="var(--text-dark)" />
              <circle cx="12" cy="8" r="4.5" fill="none" stroke="var(--primary)" strokeWidth="1.5" />
              <path d="M12 5.5v3M10.5 7h3" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="brand-name">SmartShop</span>
        </div>
      </div>

      <div className="header-right">
        <div className="profile-container">
          <button 
            className="avatar-button" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Opções do usuário"
          >
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.name} 
                className="user-avatar"
                width={36}
                height={36}
              />
            ) : (
              <div className="user-avatar-placeholder">
                {user.name.charAt(0)}
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user-info">
                <p className="dropdown-username">{user.name}</p>
                <p className="dropdown-email">{user.email}</p>
              </div>
              <hr className="dropdown-divider" />
              <button 
                className="dropdown-item logout-btn" 
                onClick={() => {
                  logout();
                  setDropdownOpen(false);
                }}
              >
                <LogOut size={16} />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
