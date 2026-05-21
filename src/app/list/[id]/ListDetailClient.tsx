'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, ShoppingBag, Plus, Users, LogOut } from 'lucide-react';
import Link from 'next/link';
import { 
  ShoppingList, 
  ListItem, 
  Collaborator,
  User,
  toggleItemBought, 
  addListItem, 
  deleteListItem,
  deleteList,
  removeCollaborator
} from '@/lib/actions';
import ListItemRow from '@/components/organisms/ListItemRow';
import AddItemForm from '@/components/organisms/AddItemForm';
import BottomSheet from '@/components/molecules/BottomSheet';
import ProgressBar from '@/components/atoms/ProgressBar';
import CollaboratorsModal from '@/components/organisms/CollaboratorsModal';

interface ListDetailClientProps {
  list: ShoppingList;
  items: ListItem[];
  currentUser: User;
  collaborators: Collaborator[];
}

export default function ListDetailClient({ 
  list, 
  items: initialItems,
  currentUser,
  collaborators
}: ListDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);

  // Ações para deletar a lista inteira
  const handleDeleteList = async () => {
    if (!confirm('Deseja realmente excluir esta lista de compras? Todos os itens serão deletados.')) return;
    
    startTransition(async () => {
      const res = await deleteList(list.id);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    });
  };

  // Ação para colaborador sair da lista
  const handleLeaveList = async () => {
    if (!confirm('Deseja realmente sair desta lista compartilhada? Você perderá o acesso a ela.')) return;

    const currentCollaborator = collaborators.find(c => c.user_id === currentUser.id);
    if (!currentCollaborator) {
      setError('Colaborador não encontrado nesta lista.');
      return;
    }

    startTransition(async () => {
      const res = await removeCollaborator(list.id, currentCollaborator.id);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    });
  };

  // Alterar checkbox do item
  const handleToggleBought = (itemId: number, currentBought: boolean) => {
    startTransition(async () => {
      const res = await toggleItemBought(itemId, !currentBought);
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  // Excluir item individual
  const handleDeleteItem = (itemId: number) => {
    startTransition(async () => {
      const res = await deleteListItem(itemId);
      if (res?.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  // Callback de Adicionar Item
  const handleAddItem = (name: string, quantity: number, price: number) => {
    setError(null);
    startTransition(async () => {
      const res = await addListItem(list.id, name, quantity, price);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsAddSheetOpen(false);
        router.refresh();
      }
    });
  };

  // CÁLCULO DO ORÇAMENTO EM TEMPO REAL
  const totalEstimated = initialItems.reduce((sum, item) => sum + (item.estimated_price * item.quantity), 0);
  
  const totalSpent = initialItems.reduce((sum, item) => {
    return sum + (item.is_bought ? (item.estimated_price * item.quantity) : 0);
  }, 0);

  // Progresso dos itens
  const totalCount = initialItems.length;
  const boughtCount = initialItems.filter(i => i.is_bought).length;
  const progressPercent = totalCount > 0 ? Math.round((boughtCount / totalCount) * 100) : 0;

  return (
    <div className="view-content animate-fade-in" style={{ paddingBottom: '160px' }}>
      {/* Header com botão de voltar e excluir */}
      <div className="list-detail-header">
        <Link href="/dashboard" className="icon-button" aria-label="Voltar para dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <ArrowLeft size={22} />
        </Link>
        <div className="list-detail-title-block">
          <div className="list-detail-title-row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h1 className="list-detail-title" style={{ margin: 0 }}>{list.title}</h1>
            {list.is_shared && (
              <span 
                onClick={() => setIsShareSheetOpen(true)}
                title="Ver colaboradores"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '11px', 
                  background: 'var(--primary-light, #e8f9f2)', 
                  color: 'var(--primary, #3ebd93)', 
                  padding: '4px 8px', 
                  borderRadius: '20px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                }}
              >
                <Users size={12} />
                <span>{collaborators.filter(c => c.status === 'accepted').length + 1}</span>
              </span>
            )}
          </div>
          <p className="list-detail-meta">
            Categoria: <strong>{list.category}</strong> • {list.is_shared ? 'Lista Compartilhada' : 'Lista Pessoal'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {list.user_id === currentUser.id && (
            <button 
              className="icon-button"
              onClick={() => setIsShareSheetOpen(true)}
              title="Gerenciar Colaboradores"
              aria-label="Gerenciar Colaboradores"
              style={{
                width: '42px',
                height: '42px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-dark)',
                cursor: 'pointer'
              }}
            >
              <Users size={20} />
            </button>
          )}
          <button 
            className="btn-new-list"
            onClick={() => setIsAddSheetOpen(true)}
            title="Adicionar Produto"
            aria-label="Adicionar Produto"
          >
            <Plus size={18} />
            <span>Novo Item</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Bottom Sheet com Formulário Adicionar Item */}
      <BottomSheet 
        isOpen={isAddSheetOpen} 
        onClose={() => setIsAddSheetOpen(false)}
        title="Novo Produto"
      >
        <AddItemForm
          onAddItem={handleAddItem}
          isPending={isPending}
        />
      </BottomSheet>

      {/* Bottom Sheet de Colaboradores */}
      <BottomSheet 
        isOpen={isShareSheetOpen} 
        onClose={() => setIsShareSheetOpen(false)}
        title="Colaboradores"
      >
        <CollaboratorsModal
          listId={list.id}
          collaborators={collaborators}
          isOwner={list.user_id === currentUser.id}
        />
      </BottomSheet>

      {/* Checklist de Itens */}
      <div className="checklist-container">
        {initialItems.length > 0 ? (
          initialItems.map(item => (
            <ListItemRow
              key={item.id}
              item={item}
              onToggle={() => handleToggleBought(item.id, item.is_bought)}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))
        ) : (
          <div className="empty-state">
            <ShoppingBag size={40} />
            <p>Sua lista está vazia.</p>
            <p style={{ fontSize: '12px' }}>Adicione produtos acima para começar.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        {list.user_id === currentUser.id ? (
          <button 
            className="btn-danger"
            onClick={handleDeleteList}
            title="Excluir Lista"
          >
            <Trash2 size={18} />
            <span>Excluir Lista</span>
          </button>
        ) : (
          <button 
            className="btn-warning"
            onClick={handleLeaveList}
            title="Sair da Lista"
          >
            <LogOut size={18} />
            <span>Sair da Lista</span>
          </button>
        )}
      </div>

      {/* Barra de Orçamento Fixada Inferior (Modo Compra) */}
      <div className="budget-bar">
        <div className="budget-stats-row">
          <div className="budget-stat">
            <span className="budget-label">Itens</span>
            <span className="budget-value">{boughtCount}/{totalCount}</span>
          </div>
          <div className="budget-stat" style={{ textAlign: 'center' }}>
            <span className="budget-label">Gasto Real</span>
            <span className="budget-value" style={{ color: 'var(--primary)' }}>R$ {totalSpent.toFixed(2)}</span>
          </div>
          <div className="budget-stat" style={{ textAlign: 'right' }}>
            <span className="budget-label">Orçamento Est.</span>
            <span className="budget-value">R$ {totalEstimated.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Barra de progresso do orçamento */}
        <ProgressBar value={progressPercent} variant="budget" />
      </div>
    </div>
  );
}
