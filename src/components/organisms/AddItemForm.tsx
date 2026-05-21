import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Input from '../atoms/Input';
import Button from '../atoms/Button';

interface AddItemFormProps {
  onAddItem: (name: string, quantity: number, price: number) => void;
  isPending: boolean;
}

export default function AddItemForm({
  onAddItem,
  isPending
}: AddItemFormProps) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const parseCurrency = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, '').replace(',', '.'));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setPrice('');
      return;
    }
    const numValue = parseInt(rawValue, 10) / 100;
    setPrice(formatCurrency(numValue));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = parseCurrency(price);
    onAddItem(name, qty, parsedPrice);

    // Reset fields
    setName('');
    setQty(1);
    setPrice('');
  };

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      <Input
        type="text"
        className="form-item-input"
        placeholder="Nome do produto (ex: Cenoura)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={isPending}
      />
      
      <div className="add-item-row-fields">
        <Input
          type="number"
          className="form-item-input"
          placeholder="Qtd (ex: 2)"
          min="1"
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value) || 1)}
          required
          disabled={isPending}
        />
        <Input
          type="text"
          className="form-item-input"
          placeholder="Preço Est. (R$)"
          value={price}
          onChange={handlePriceChange}
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="btn-add-item"
        isPending={isPending}
        style={{ width: '100%', padding: '10px' }}
      >
        {!isPending && <Plus size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />}
        Adicionar Item
      </Button>
    </form>
  );
}
