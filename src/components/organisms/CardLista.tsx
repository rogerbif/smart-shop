'use client';

import Link from 'next/link';
import { 
  ChevronRight, 
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

  // Obter imagem de capa da categoria via Unsplash
  const getCategoryImageUrl = (category: string) => {
    switch (category) {
      case 'Supermercado':
        return 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop';
      case 'Farmácia':
        return 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=150&auto=format&fit=crop';
      case 'Eventos':
        return 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=150&auto=format&fit=crop';
      case 'Material Escolar':
        return 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=150&auto=format&fit=crop';
      case 'Coisas que quero comprar':
      case 'Móveis para casa':
        return 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=150&auto=format&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=150&auto=format&fit=crop';
    }
  };

  return (
    <Link href={`/list/${list.id}`} className="list-card-link">
      <div className="list-card">
        {/* Imagem de categoria no canto esquerdo */}
        <img 
          src={getCategoryImageUrl(list.category)} 
          alt={list.category} 
          className="list-card-thumbnail"
        />

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
