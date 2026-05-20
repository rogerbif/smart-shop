import React from 'react';
import { RotateCw } from 'lucide-react';
import { PantryItem } from '@/lib/actions';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';

interface PantryCardProps {
  item: PantryItem;
  onUpdateStock: () => void;
  onReplenish: () => void;
  isPending: boolean;
}

export default function PantryCard({
  item,
  onUpdateStock,
  onReplenish,
  isPending
}: PantryCardProps) {
  const needsReplenishment = item.stock_level === 'Em Falta' || item.stock_level === 'Baixo';
  
  // Transform stock level for variant mapping: 'Cheio' -> 'cheio', 'Baixo' -> 'baixo', 'Em Falta' -> 'em-falta'
  const badgeVariant = item.stock_level.toLowerCase().replace(' ', '-') as 'cheio' | 'baixo' | 'em-falta';

  return (
    <div className="pantry-card">
      <div className="pantry-card-left">
        <span className="pantry-title">{item.name}</span>
        <span className="pantry-desc">{item.quantity}</span>
      </div>
      <div className="pantry-card-right">
        {/* Badge Interativo para estoque */}
        <button 
          onClick={onUpdateStock}
          title="Clique para alternar nível de estoque"
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: 0, 
            display: 'inline-flex',
            alignItems: 'center'
          }}
          type="button"
        >
          <Badge 
            variant={badgeVariant}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>{item.stock_level}</span>
            <RotateCw size={10} />
          </Badge>
        </button>

        {needsReplenishment && (
          <Button 
            className="btn-replenish"
            onClick={onReplenish}
            disabled={isPending}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            + Repor
          </Button>
        )}
      </div>
    </div>
  );
}
