import { getCurrentUser } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { BarChart3, Clock, Wallet, CheckSquare } from 'lucide-react';
import Link from 'next/link';

interface ListCostRow {
  title: string;
  total_cost: number;
  spent_cost: number;
}

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  // 1. Buscar listas com itens para calcular custos
  const supabase = await createServerClient();
  const { data: listsWithItems } = await supabase
    .from('lists')
    .select('id, title, created_at, items(estimated_price, quantity, is_bought)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const listCosts: ListCostRow[] = (listsWithItems || []).map((list: any) => {
    const items = list.items || [];
    const total_cost = items.reduce((sum: number, i: any) => sum + (parseFloat(i.estimated_price) * i.quantity), 0);
    const spent_cost = items.reduce((sum: number, i: any) => {
      return sum + (i.is_bought ? (parseFloat(i.estimated_price) * i.quantity) : 0);
    }, 0);
    return { title: list.title, total_cost, spent_cost };
  });

  // 2. Estatísticas gerais — buscar TODAS as listas (sem limit)
  const { data: allListsWithItems } = await supabase
    .from('lists')
    .select('id, items(estimated_price, quantity, is_bought)')
    .eq('user_id', user.id);

  const allLists = allListsWithItems || [];
  const totalLists = allLists.length;
  let totalItems = 0;
  let boughtItems = 0;
  let totalEstimated = 0;
  let totalSpent = 0;

  for (const list of allLists) {
    const items = (list as any).items || [];
    totalItems += items.length;
    for (const item of items) {
      const price = parseFloat(item.estimated_price) * item.quantity;
      totalEstimated += price;
      if (item.is_bought) {
        boughtItems++;
        totalSpent += price;
      }
    }
  }

  // Gerar dados do gráfico SVG
  const chartHeight = 150;
  const chartWidth = 320;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 30;
  
  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Achar o maior valor para escala
  const maxVal = Math.max(...listCosts.map(l => Math.max(l.total_cost, l.spent_cost)), 100);

  return (
    <div className="view-content animate-fade-in" style={{ paddingBottom: '90px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)' }}>Relatórios e Gastos</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Métricas de economia e desempenho de compras.</p>
      </div>

      {/* Grid de Cards de Estatísticas */}
      <div className="report-summary-cards">
        <div className="report-summary-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
            <Wallet size={18} />
            <span className="report-summary-label">Total Gasto</span>
          </div>
          <p className="report-summary-value">R$ {totalSpent.toFixed(2)}</p>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>de R$ {totalEstimated.toFixed(2)} est.</span>
        </div>

        <div className="report-summary-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cat-escola-color)' }}>
            <Clock size={18} />
            <span className="report-summary-label">Tempo Médio</span>
          </div>
          <p className="report-summary-value">26 min</p>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Por lista (-18% vs mês ant.)</span>
        </div>

        <div className="report-summary-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)' }}>
            <CheckSquare size={18} />
            <span className="report-summary-label">Itens Adquiridos</span>
          </div>
          <p className="report-summary-value">{boughtItems}/{totalItems}</p>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{totalItems > 0 ? Math.round((boughtItems / totalItems) * 100) : 0}% de conclusão</span>
        </div>

        <div className="report-summary-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cat-eventos-color)' }}>
            <BarChart3 size={18} />
            <span className="report-summary-label">Listas Ativas</span>
          </div>
          <p className="report-summary-value">{totalLists}</p>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Criadas no app</span>
        </div>
      </div>

      {/* Gráfico de Finanças */}
      <div className="chart-card">
        <h3 className="chart-title">Orçamento vs Gasto Real (Top Listas)</h3>
        
        {listCosts.length > 0 ? (
          <div className="chart-svg-container">
            <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
              {/* Linhas de Grade Verticais */}
              <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={chartHeight - paddingBottom} stroke="var(--border-color)" strokeWidth="1.5" />
              <line x1={chartWidth - paddingRight} y1={paddingTop} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3" />
              <line x1={paddingLeft + graphWidth/2} y1={paddingTop} x2={paddingLeft + graphWidth/2} y2={chartHeight - paddingBottom} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3" />
              
              {/* Barras e Títulos */}
              {listCosts.map((list, index) => {
                const barSpacing = graphHeight / listCosts.length;
                const y = paddingTop + (index * barSpacing) + 5;
                const barHeight = 8;
                
                // Calcular comprimentos com base no maior valor
                const widthEst = (list.total_cost / maxVal) * (graphWidth - 20);
                const widthSpent = (list.spent_cost / maxVal) * (graphWidth - 20);
                
                // Abreviação do título se muito longo
                const label = list.title.length > 12 ? list.title.substring(0, 10) + '..' : list.title;

                return (
                  <g key={index}>
                    {/* Rótulo da Lista */}
                    <text x={paddingLeft - 5} y={y + 12} fill="var(--text-dark)" fontSize="9" fontWeight="700" textAnchor="end">
                      {label}
                    </text>

                    {/* Barra Estimada */}
                    <rect x={paddingLeft} y={y} width={Math.max(widthEst, 2)} height={barHeight} fill="var(--border-color)" rx="3" />
                    
                    {/* Barra Real Gasto */}
                    <rect x={paddingLeft} y={y + 10} width={Math.max(widthSpent, 2)} height={barHeight} fill="var(--primary)" rx="3" />

                    {/* Exibição Numérica */}
                    <text x={paddingLeft + Math.max(widthEst, widthSpent) + 5} y={y + 12} fill="var(--text-muted)" fontSize="8" fontWeight="600">
                      R$ {list.spent_cost.toFixed(0)}/{list.total_cost.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Legenda X */}
              <text x={paddingLeft} y={chartHeight - 10} fill="var(--text-muted)" fontSize="8">R$ 0</text>
              <text x={paddingLeft + graphWidth/2} y={chartHeight - 10} fill="var(--text-muted)" fontSize="8" textAnchor="middle">R$ {(maxVal / 2).toFixed(0)}</text>
              <text x={chartWidth - paddingRight} y={chartHeight - 10} fill="var(--text-muted)" fontSize="8" textAnchor="end">R$ {maxVal.toFixed(0)}</text>
            </svg>
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Crie listas de compras com estimativa de preço para gerar o relatório gráfico.
          </div>
        )}

        {listCosts.length > 0 && (
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--border-color)' }}></div>
              <span>Orçamento Estimado</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--primary)' }}></div>
              <span>Gasto Realizado</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
