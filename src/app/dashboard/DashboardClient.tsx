'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ListTodo } from 'lucide-react';
import { ShoppingList } from '@/lib/actions';
import CardLista from '@/components/organisms/CardLista';
import TabGroup from '@/components/molecules/TabGroup';

interface DashboardClientProps {
  initialLists: ShoppingList[];
}

const DASHBOARD_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'personal', label: 'Pessoais' },
  { id: 'shared', label: 'Compartilhadas' }
];

export default function DashboardClient({ initialLists }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'shared'>('all');

  // Filtrar as listas localmente baseado na aba selecionada
  const filteredLists = initialLists.filter(list => {
    if (activeTab === 'personal') return !list.is_shared;
    if (activeTab === 'shared') return list.is_shared;
    return true;
  });

  return (
    <div className="view-content animate-fade-in">
      {/* Cabeçalho da Página (Estilo limpo correspondente às outras páginas) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)' }}>Minhas Listas</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Organize suas compras</p>
        </div>
        <Link href="/create" className="btn-new-list">
          <Plus size={18} />
          <span>Nova lista</span>
        </Link>
      </div>

      {/* Filtros por Abas */}
      <TabGroup
        tabs={DASHBOARD_TABS}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Listagem de Cards */}
      <div className="lists-grid">
        {filteredLists.length > 0 ? (
          filteredLists.map(list => (
            <CardLista key={list.id} list={list} />
          ))
        ) : (
          <div className="empty-state">
            <ListTodo size={48} />
            <p>Nenhuma lista encontrada para esta categoria.</p>
            <Link href="/create" className="btn-primary" style={{ marginTop: '10px', textDecoration: 'none' }}>
              Criar Primeira Lista
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
