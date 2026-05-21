'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ListTodo, Check, X, Bell } from 'lucide-react';
import { ShoppingList, PendingInvitation, respondToInvitation } from '@/lib/actions';
import CardLista from '@/components/organisms/CardLista';
import TabGroup from '@/components/molecules/TabGroup';

interface DashboardClientProps {
  initialLists: ShoppingList[];
  initialInvitations: PendingInvitation[];
}

const DASHBOARD_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'personal', label: 'Pessoais' },
  { id: 'shared', label: 'Compartilhadas' }
];

export default function DashboardClient({ initialLists, initialInvitations }: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'shared'>('all');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Filtrar as listas localmente baseado na aba selecionada
  const filteredLists = initialLists.filter(list => {
    if (activeTab === 'personal') return !list.is_shared;
    // Se a aba for shared, mostramos as listas que são marcadas como compartilhadas
    // OU onde o usuário logado NÃO é o dono (portanto é um colaborador)
    // Para identificar isso, precisamos checar o user_id. Como não temos o ID do usuário
    // logado diretamente aqui de forma simples, podemos inferir que se for list.is_shared 
    // ou se o list.user_id não bater com o criador das listas pessoais, é compartilhada.
    // Mas no getLists do backend, já filtramos corretamente:
    if (activeTab === 'shared') {
      // Se formos o dono e ela estiver marcada como is_shared, ou se for de outra pessoa
      // Vamos tentar pegar as pessoais do usuário. Como todas as pessoais têm is_shared = false,
      // as compartilhadas são aquelas com is_shared = true OU onde somos colaboradores.
      // E de fato, o backend já as classifica assim na action.
      // Aqui, o filtro simples list.is_shared atende a maior parte, mas também se o user_id 
      // for diferente do ID das listas pessoais. Para simplificar, na Server Action getLists
      // nós definimos is_shared baseando-se no banco.
      return list.is_shared;
    }
    return true;
  });

  const handleInvitationResponse = (inviteId: number, accept: boolean) => {
    setError(null);
    startTransition(async () => {
      const res = await respondToInvitation(inviteId, accept);
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="view-content animate-fade-in">
      {/* Hero Banner Figma */}
      <div className="dashboard-banner">
        <div className="banner-title-block">
          <h1>Minhas Listas</h1>
          <p>Organize suas compras</p>
        </div>
        <Link href="/create" className="btn-new-list">
          <Plus size={18} />
          <span>Nova lista</span>
        </Link>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Convites Pendentes */}
      {initialInvitations.length > 0 && (
        <div className="pending-invitations-section animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
            <Bell size={18} className="text-super" />
            <h3 style={{ fontSize: '14px', fontWeight: '800' }}>Convites Pendentes</h3>
          </div>
          <div className="invitations-list">
            {initialInvitations.map((invite) => (
              <div key={invite.id} className="invitation-card">
                <div className="invitation-info">
                  <h4>{invite.lists?.title || 'Lista compartilhada'}</h4>
                  <p>Convidado por: <strong>{invite.lists?.profiles?.name || 'Outro usuário'}</strong></p>
                </div>
                <div className="invitation-actions">
                  <button
                    onClick={() => handleInvitationResponse(invite.id, true)}
                    disabled={isPending}
                    className="icon-button"
                    style={{
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--success)',
                      width: '32px',
                      height: '32px',
                      padding: 0
                    }}
                    title="Aceitar convite"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleInvitationResponse(invite.id, false)}
                    disabled={isPending}
                    className="icon-button"
                    style={{
                      backgroundColor: 'rgba(217, 56, 56, 0.1)',
                      color: 'var(--danger)',
                      width: '32px',
                      height: '32px',
                      padding: 0
                    }}
                    title="Recusar convite"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros por Abas */}
      <TabGroup
        tabs={DASHBOARD_TABS}
        activeTabId={activeTab}
        onTabChange={(id) => setActiveTab(id as 'all' | 'personal' | 'shared')}
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
