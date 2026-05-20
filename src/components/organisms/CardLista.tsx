'use client';

import Link from 'next/link';
import { 
  ChevronRight, 
  ShoppingCart, 
  Pill, 
  Sparkles, 
  BookOpen, 
  Calendar,
  ListTodo,
  Users2,
  Lock
} from 'lucide-react';
import { ShoppingList } from '@/lib/actions';
import Badge from '../atoms/Badge';
import ProgressBar from '../atoms/ProgressBar';

interface CardListaProps {
  list: ShoppingList;
}

export default function CardLista({ list }: CardListaProps) {
  // Calcular porcentagem de progresso
  const total = list.total_items;
  const bought = list.bought_items;
  const progressPercent = total > 0 ? Math.round((bought / total) * 100) : 0;

  // Selecionar ícone baseado na categoria
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Supermercado':
        return <ShoppingCart className="cat-icon text-super" size={24} />;
      case 'Farmácia':
        return <Pill className="cat-icon text-farmacia" size={24} />;
      case 'Eventos':
        return <Calendar className="cat-icon text-eventos" size={24} />;
      case 'Material Escolar':
        return <BookOpen className="cat-icon text-escola" size={24} />;
      case 'Coisas que quero comprar':
        return <Sparkles className="cat-icon text-desejos" size={24} />;
      default:
        return <ListTodo className="cat-icon text-default" size={24} />;
    }
  };

  const cleanCategoryClass = `cat-${list.category.toLowerCase().replace(/\s+/g, '-') || 'default'}`;

  return (
    <Link href={`/list/${list.id}`} className="list-card-link">
      <div className="list-card">
        {/* Ícone ilustrativo esquerdo */}
        <div className={`list-card-icon-wrapper ${cleanCategoryClass}`}>
          {getCategoryIcon(list.category)}
        </div>

        {/* Informações centrais */}
        <div className="list-card-content">
          <div className="list-card-title-row">
            <h3 className="list-card-title">{list.title}</h3>
            <Badge variant={list.is_shared ? 'shared' : 'personal'}>
              {list.is_shared ? (
                <>
                  <Users2 size={12} />
                  <span>Compartilhada</span>
                </>
              ) : (
                <>
                  <Lock size={12} />
                  <span>Pessoal</span>
                </>
              )}
            </Badge>
          </div>

          <div className="list-card-progress-row">
            {/* Barra de progresso linear verde-menta */}
            <ProgressBar value={progressPercent} />
            {/* Fração numérica indicativa */}
            <span className="progress-fraction">
              {bought}/{total}
            </span>
          </div>
        </div>

        {/* Seta de navegação para a direita */}
        <div className="list-card-arrow">
          <ChevronRight size={20} />
        </div>
      </div>
    </Link>
  );
}
