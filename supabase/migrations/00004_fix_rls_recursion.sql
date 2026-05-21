-- ==========================================================================
-- SmartShop: Correção de Recorrência RLS (Políticas de Colaboração)
-- v0.4.1 - Funções SECURITY DEFINER e novas políticas RLS
-- ==========================================================================

-- 1. Criar função SECURITY DEFINER para verificar propriedade da lista
CREATE OR REPLACE FUNCTION public.is_list_owner(check_list_id BIGINT, check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.lists
        WHERE id = check_list_id
          AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Criar função SECURITY DEFINER para verificar se o usuário é colaborador ativo
CREATE OR REPLACE FUNCTION public.is_collaborator(check_list_id BIGINT, check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.list_collaborators
        WHERE list_id = check_list_id
          AND user_id = check_user_id
          AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar Políticas da tabela public.list_collaborators
DROP POLICY IF EXISTS "Dono da lista pode gerenciar colaboradores" ON public.list_collaborators;
DROP POLICY IF EXISTS "Colaboradores aceitos podem ver outros colaboradores" ON public.list_collaborators;

CREATE POLICY "Dono da lista pode gerenciar colaboradores"
    ON public.list_collaborators FOR ALL
    USING (
        public.is_list_owner(list_id, auth.uid())
    );

CREATE POLICY "Colaboradores aceitos podem ver outros colaboradores"
    ON public.list_collaborators FOR SELECT
    USING (
        public.is_collaborator(list_id, auth.uid())
    );

-- 4. Recriar Políticas da tabela public.lists
DROP POLICY IF EXISTS "Usuários podem visualizar listas que possuem ou colaboram" ON public.lists;

CREATE POLICY "Usuários podem visualizar listas que possuem ou colaboram"
    ON public.lists FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        public.is_collaborator(id, auth.uid())
    );

-- 5. Recriar Políticas da tabela public.items
DROP POLICY IF EXISTS "Usuários podem ver itens de suas listas ou compartilhadas" ON public.items;
DROP POLICY IF EXISTS "Usuários podem adicionar itens em suas listas ou compartilhadas" ON public.items;
DROP POLICY IF EXISTS "Usuários podem editar itens em suas listas ou compartilhadas" ON public.items;
DROP POLICY IF EXISTS "Usuários podem excluir itens em suas listas ou compartilhadas" ON public.items;

CREATE POLICY "Usuários podem ver itens de suas listas ou compartilhadas"
    ON public.items FOR SELECT
    USING (
        public.is_list_owner(list_id, auth.uid())
        OR
        public.is_collaborator(list_id, auth.uid())
    );

CREATE POLICY "Usuários podem adicionar itens em suas listas ou compartilhadas"
    ON public.items FOR INSERT
    WITH CHECK (
        public.is_list_owner(list_id, auth.uid())
        OR
        public.is_collaborator(list_id, auth.uid())
    );

CREATE POLICY "Usuários podem editar itens em suas listas ou compartilhadas"
    ON public.items FOR UPDATE
    USING (
        public.is_list_owner(list_id, auth.uid())
        OR
        public.is_collaborator(list_id, auth.uid())
    );

CREATE POLICY "Usuários podem excluir itens em suas listas ou compartilhadas"
    ON public.items FOR DELETE
    USING (
        public.is_list_owner(list_id, auth.uid())
        OR
        public.is_collaborator(list_id, auth.uid())
    );
