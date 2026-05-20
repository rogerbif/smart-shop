'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  ShoppingCart, 
  Pill, 
  BookOpen, 
  Sparkles, 
  ListTodo, 
  ArrowLeft,
  Users2,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { createListFromTemplates } from '@/lib/actions';
import CheckboxField from '@/components/molecules/CheckboxField';
import InputField from '@/components/molecules/InputField';
import Button from '@/components/atoms/Button';

const TEMPLATES = [
  { id: 'Supermercado', name: 'Supermercado', icon: <ShoppingCart size={20} /> },
  { id: 'Farmácia', name: 'Farmácia', icon: <Pill size={20} /> },
  { id: 'Eventos', name: 'Eventos / Churrasco', icon: <Calendar size={20} /> },
  { id: 'Material Escolar', name: 'Material Escolar', icon: <BookOpen size={20} /> },
  { id: 'Coisas que quero comprar', name: 'Desejos (Coisas que quero comprar)', icon: <Sparkles size={20} /> },
  { id: 'Criar lista personalizada', name: 'Criar lista personalizada', icon: <ListTodo size={20} /> },
];

export default function CreateClient() {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggleTemplate = (id: string) => {
    setSelectedTemplates(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCreate = async () => {
    if (selectedTemplates.length === 0) {
      setError('Por favor, selecione pelo menos um tipo de lista.');
      return;
    }

    if (selectedTemplates.includes('Criar lista personalizada') && !customTitle.trim()) {
      setError('Por favor, digite um nome para sua lista personalizada.');
      return;
    }

    setError(null);

    startTransition(async () => {
      const res = await createListFromTemplates(selectedTemplates, customTitle, isShared);
      if (res?.error) {
        setError(res.error);
      } else if (res?.listId) {
        router.push(`/list/${res.listId}`);
        router.refresh();
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    });
  };

  const isCustomSelected = selectedTemplates.includes('Criar lista personalizada');

  return (
    <div className="view-content animate-fade-in" style={{ paddingBottom: '110px' }}>
      {/* Header com botão de voltar */}
      <div className="list-detail-header">
        <Link href="/dashboard" className="icon-button" aria-label="Voltar" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </Link>
        <div className="create-header">
          <h2>Nova Lista</h2>
          <p>Selecione um ou mais modelos básicos</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Grid de Templates */}
      <div className="templates-grid">
        {TEMPLATES.map(tpl => {
          const isSelected = selectedTemplates.includes(tpl.id);
          return (
            <CheckboxField
              key={tpl.id}
              checked={isSelected}
              onChange={() => handleToggleTemplate(tpl.id)}
              className={`template-card ${isSelected ? 'selected' : ''}`}
              variant="square"
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                  <div className="list-card-icon-wrapper" style={{ width: '36px', height: '36px', background: 'rgba(16, 42, 67, 0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {tpl.icon}
                  </div>
                  <span className="template-name">{tpl.name}</span>
                </div>
              }
            />
          );
        })}
      </div>

      {/* Input para Lista Personalizada se selecionado */}
      {isCustomSelected && (
        <div className="custom-list-form">
          <InputField
            label="Nome da Lista Personalizada"
            id="custom-title"
            placeholder="Ex: Presentes de Aniversário, Viagem, etc."
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      )}

      {/* Checkbox Compartilhada */}
      <CheckboxField
        checked={isShared}
        onChange={() => setIsShared(!isShared)}
        className="checkbox-shared-container"
        variant="square"
        label={
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
            {isShared ? <Users2 size={16} /> : <Lock size={16} />}
            {isShared ? 'Compartilhar Lista' : 'Lista Estritamente Pessoal'}
          </span>
        }
        description={
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>
            Permitir que outros membros da família vejam e editem.
          </span>
        }
      />

      {/* Botão de Criação */}
      <Button 
        variant="primary" 
        style={{ marginTop: '20px', width: '100%', padding: '14px' }}
        onClick={handleCreate}
        isPending={isPending}
      >
        + Criar lista
      </Button>
    </div>
  );
}
