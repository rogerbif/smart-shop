-- ==========================================================================
-- SmartShop: Correção da Política de Leitura de Listas para Convidados Pendentes
-- v0.4.2 - Nova função SECURITY DEFINER e atualização da política SELECT de lists
-- ==========================================================================

-- 1. Criar função SECURITY DEFINER para verificar se o usuário foi convidado ou é colaborador ativo/pendente
CREATE OR REPLACE FUNCTION public.is_invited_or_collaborator(check_list_id BIGINT, check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.list_collaborators
        WHERE list_id = check_list_id
          AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Recriar Política de SELECT na tabela public.lists
DROP POLICY IF EXISTS "Usuários podem visualizar listas que possuem ou colaboram" ON public.lists;

CREATE POLICY "Usuários podem visualizar listas que possuem ou colaboram"
    ON public.lists FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        public.is_invited_or_collaborator(id, auth.uid())
    );
