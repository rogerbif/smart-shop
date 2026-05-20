'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { 
  ShoppingList, 
  ListItem, 
  toggleItemBought, 
  addListItem, 
  deleteListItem,
  deleteList
} from '@/lib/actions';
import ListItemRow from '@/components/organisms/ListItemRow';
import AddItemForm from '@/components/organisms/AddItemForm';
import ProgressBar from '@/components/atoms/ProgressBar';
import Button from '@/components/atoms/Button';

interface ListDetailClientProps {
  list: ShoppingList;
  items: ListItem[];
}

export default function ListDetailClient({ list, items: initialItems }: ListDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
          <div className="list-detail-title-row">
            <h1 className="list-detail-title">{list.title}</h1>
          </div>
          <p className="list-detail-meta">
            Categoria: <strong>{list.category}</strong> • {list.is_shared ? 'Lista Compartilhada' : 'Lista Pessoal'}
          </p>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleDeleteList}
          title="Excluir Lista"
          aria-label="Excluir lista"
          style={{ color: 'var(--danger)', padding: '6px' }}
        >
          <Trash2 size={20} />
        </Button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Formulário Adicionar Item */}
      <AddItemForm
        onAddItem={handleAddItem}
        isPending={isPending}
      />

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
