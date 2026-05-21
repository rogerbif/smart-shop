# Histórico do Projeto: SmartShop

### [21/05/2026] v0.4.0 - Compartilhamento de Listas, Máscara Monetária e Redesenho da Interface (Figma)
- [Feature] **Compartilhamento e Colaboração**: Implementação de sistema lógico multi-tenancy via RLS para permitir múltiplos colaboradores por lista de compras. Adicionado fluxo de envio, recebimento, aceitação e recusa de convites de e-mail, incluindo trigger para vincular convites retroativamente para novos usuários.
- [UI/UX] **Máscara Monetária BRL**: Implementação de formatação monetária (BRL) em tempo real no campo de preço do formulário de itens.
- [UX/DesignOps] **Redesenho Fiel ao Figma**: Nova logo centralizada, menu hambúrguer com painel lateral Sidebar para perfil e links, BottomNav de altura compacta (`56px`) com status superior azul de item ativo, Hero Banner estilizado com imagem do Unsplash e cards de listas com miniatura de categoria lateral (56px) e barra de progresso verde-escura Figma.

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

### [20/05/2026] v0.3.0 - Migração da Autenticação: Supabase Auth (Fase 2)
- [Auth] **Supabase Auth Nativo**: Substituída a autenticação manual pelo `@supabase/ssr` (`signUp`, `signInWithPassword`, `signOut`).
- [Auth] **Proxy de Sessão**: Adicionado `src/proxy.ts` (Next.js 16) para gerenciar renovação de tokens JWT e proteger rotas autenticadas.
- [Infra] **Segurança (RLS)**: Habilitado o *Row Level Security* em todas as tabelas, garantindo o isolamento total dos dados por usuário diretamente no banco.
- [Database] **Trigger Automático**: Criado gatilho no PostgreSQL (`handle_new_user`) para gerar automaticamente o registro na tabela `profiles` quando uma conta é criada.
- [Database] **Limpeza de Schema**: Removidas as colunas `email` e `password` da tabela `profiles`.
- [UI] **Formulários Atualizados**: `RegisterForm` agora solicita o nome do usuário. `LoginForm` limpo de credenciais default e aviso de teste.
