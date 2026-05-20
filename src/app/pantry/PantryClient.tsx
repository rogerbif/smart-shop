'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Package, HelpCircle } from 'lucide-react';
import { PantryItem, replenishPantryItem, updatePantryStock } from '@/lib/actions';
import PantryCard from '@/components/organisms/PantryCard';

interface PantryClientProps {
  items: PantryItem[];
}

export default function PantryClient({ items: initialItems }: PantryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleReplenish = (itemId: number, itemName: string) => {
    startTransition(async () => {
      const res = await replenishPantryItem(itemId);
      if (res?.error) {
        alert(res.error);
      } else {
        setSuccessMsg(`"${itemName}" adicionado à lista de "Reposição de Despensa"!`);
        setTimeout(() => setSuccessMsg(null), 3000);
        router.refresh();
      }
    });
  };

  const handleUpdateStock = (itemId: number, currentLevel: 'Cheio' | 'Baixo' | 'Em Falta') => {
    // Rotacionar estoque: Cheio -> Baixo -> Em Falta -> Cheio
    let nextLevel: 'Cheio' | 'Baixo' | 'Em Falta';
    if (currentLevel === 'Cheio') nextLevel = 'Baixo';
    else if (currentLevel === 'Baixo') nextLevel = 'Em Falta';
    else nextLevel = 'Cheio';

    startTransition(async () => {
      await updatePantryStock(itemId, nextLevel);
      router.refresh();
    });
  };

  return (
    <div className="view-content animate-fade-in">
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)' }}>Controle de Despensa</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Gerencie o estoque doméstico de itens essenciais.</p>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--success)', border: '1px solid var(--primary)', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', fontWeight: '700' }}>
          {successMsg}
        </div>
      )}

      <div className="pantry-grid">
        {initialItems.length > 0 ? (
          initialItems.map(item => (
            <PantryCard
              key={item.id}
              item={item}
              onUpdateStock={() => handleUpdateStock(item.id, item.stock_level)}
              onReplenish={() => handleReplenish(item.id, item.name)}
              isPending={isPending}
            />
          ))
        ) : (
          <div className="empty-state">
            <Package size={48} />
            <p>Sua despensa está vazia.</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(16,42,67,0.03)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <HelpCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span><strong>Dica:</strong> Toque no status de estoque (ex: <i>Cheio</i>) para rotacionar o nível e testar o envio de reposição automática para sua lista de compras!</span>
      </div>
    </div>
  );
}
