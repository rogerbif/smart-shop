'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListTodo, BarChart3, Package } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Oculta a BottomNav nas telas sem navegação inferior
  if (pathname === '/' || pathname === '/register' || pathname.startsWith('/list/')) return null;

  return (
    <nav className="bottom-nav">
      <Link 
        href="/dashboard" 
        className={`nav-item ${pathname === '/dashboard' || pathname.startsWith('/list/') ? 'active' : ''}`}
      >
        <ListTodo size={20} />
        <span>Listas</span>
      </Link>
      
      <Link 
        href="/reports" 
        className={`nav-item ${pathname === '/reports' ? 'active' : ''}`}
      >
        <BarChart3 size={20} />
        <span>Relatórios</span>
      </Link>
      
      <Link 
        href="/pantry" 
        className={`nav-item ${pathname === '/pantry' ? 'active' : ''}`}
      >
        <Package size={20} />
        <span>Despensa</span>
      </Link>
    </nav>
  );
}
