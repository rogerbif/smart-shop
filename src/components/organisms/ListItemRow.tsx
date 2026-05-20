import React from 'react';
import { Trash2 } from 'lucide-react';
import { ListItem } from '@/lib/actions';
import CheckboxField from '../molecules/CheckboxField';
import Button from '../atoms/Button';

interface ListItemRowProps {
  item: ListItem;
  onToggle: () => void;
  onDelete: () => void;
}

export default function ListItemRow({
  item,
  onToggle,
  onDelete
}: ListItemRowProps) {
  const hasPrice = item.estimated_price > 0;
  const totalPrice = item.estimated_price * item.quantity;

  return (
    <div className={`item-row ${item.is_bought ? 'bought' : ''}`}>
      <CheckboxField
        checked={item.is_bought}
        onChange={onToggle}
        variant="circle"
      />

      <div className="item-content" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <span className="item-name">{item.name}</span>
        <div className="item-details">
          <span>Qtd: {item.quantity}</span>
          {hasPrice && (
            <span>Est: R$ {item.estimated_price.toFixed(2)}</span>
          )}
          {hasPrice && (
            <strong style={{ marginLeft: 'auto', color: item.is_bought ? 'var(--success)' : 'var(--text-dark)' }}>
              Total: R$ {totalPrice.toFixed(2)}
            </strong>
          )}
        </div>
      </div>

      <Button
        variant="danger"
        onClick={onDelete}
        aria-label="Excluir item"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
