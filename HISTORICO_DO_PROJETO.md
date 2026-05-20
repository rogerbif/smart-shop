# Histórico do Projeto: SmartShop

### [20/05/2026] v0.1.0 - Refatoração UI da Tela de Lista e Bottom Sheet
- [UX/DesignOps] **Refatoração para Bottom Sheet**: O formulário de Adição de Item agora é renderizado usando um componente Atômico de Bottom Sheet no mobile.
- [UX/DesignOps] **Ajuste de Navegação na Tela de Detalhes**: Remoção da BottomNav (`/list/[id]`) para focar a experiência no conteúdo e lista.
- [UX/DesignOps] **Reposicionamento de Botões**: Botão de Adicionar Produto transferido para o cabeçalho superior direito e o botão de Excluir Lista reposicionado para o rodapé estilizado com classe `.btn-danger`.
- [Bug/Fix] **Layout do Formulário**: Correção de sobreposição ("quebra") dos campos de preço e quantidade mudando container grid para flexbox com constrição de layout (`min-width: 0`).

### [20/05/2026] v0.1.1 - Instalação Amago AI Kit
- [Infra] **Amago AI Kit**: Configuração do protocolo GEMINI como sistema mestre de inteligência na raiz do projeto e atualização de regras no `.gitignore`.

### [20/05/2026] v0.2.0 - Migração do Banco de Dados: SQLite → Supabase PostgreSQL (Fase 1)
- [Infra] **Migração de Banco de Dados**: Substituição completa do SQLite (`better-sqlite3`) pelo PostgreSQL gerenciado via Supabase local (Docker). Criação de migration oficial em `supabase/migrations/00001_initial_schema.sql`.
- [Refactor] **Reescrita de 13 Server Actions**: Todas as funções em `actions.ts` foram reescritas de queries síncronas SQLite para chamadas assíncronas do SDK `@supabase/supabase-js`.
- [Refactor] **Página de Relatórios**: `reports/page.tsx` reescrita para usar Supabase embedded selects ao invés de SQL raw.
- [Infra] **Conexão Server-Side**: Criado `src/lib/supabase.ts` com `SUPABASE_SERVICE_ROLE_KEY` (sem exposição de chaves no client).
- [Infra] **Variáveis de Ambiente**: Criado `.env.local` com credenciais do Supabase local.
- [Infra] **IDs UUID**: Tipo de `user.id` migrado de `INTEGER` para `UUID` em todas as interfaces TypeScript.
