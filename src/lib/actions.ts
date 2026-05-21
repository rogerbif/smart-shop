'use server';

import { createServerClient } from './supabase';
import { redirect } from 'next/navigation';

export interface User {
  id: string; // UUID from auth.users
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ShoppingList {
  id: number;
  title: string;
  category: string;
  is_shared: boolean;
  user_id: string; // UUID
  created_at: string;
  total_items: number;
  bought_items: number;
}

export interface ListItem {
  id: number;
  list_id: number;
  name: string;
  quantity: number;
  estimated_price: number;
  is_bought: boolean;
}

export interface PantryItem {
  id: number;
  name: string;
  stock_level: 'Cheio' | 'Baixo' | 'Em Falta';
  quantity: string;
  user_id: string; // UUID
}

export interface Collaborator {
  id: number;
  list_id: number;
  user_id: string | null;
  invited_email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'accepted';
  profiles?: {
    name: string;
    avatar_url: string | null;
  } | null;
}

export interface PendingInvitation {
  id: number;
  status: 'pending';
  lists: {
    id: number;
    title: string;
    profiles?: {
      name: string;
    } | null;
  };
}

// ----------------------------------------------------
// Autenticação (Fase 2: Supabase Auth nativo)
// ----------------------------------------------------

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro no login:', error.message);
      return { error: 'E-mail ou senha incorretos.' };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Erro no login:', error);
    return { error: 'Erro interno ao realizar login.' };
  }
}

export async function register(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !password || !confirmPassword) {
    return { error: 'Todos os campos são obrigatórios.' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' };
  }

  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name?.trim() || email.split('@')[0],
          avatar_url: null,
        },
      },
    });

    if (error) {
      console.error('Erro no cadastro:', error.message);
      if (error.message.includes('already registered')) {
        return { error: 'Este e-mail já está cadastrado.' };
      }
      return { error: 'Erro ao realizar cadastro. Tente novamente.' };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Erro no cadastro:', error);
    return { error: 'Erro interno ao realizar cadastro.' };
  }
}

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) return null;

    // Buscar profile completo
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', authUser.id)
      .single();

    return {
      id: authUser.id,
      email: authUser.email || '',
      name: profile?.name || authUser.user_metadata?.name || 'Usuário',
      avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
    };
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// Listas de Compras
// ----------------------------------------------------

export async function getLists(filter: 'all' | 'personal' | 'shared'): Promise<ShoppingList[]> {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();
    // A RLS irá retornar as listas próprias e aquelas em que somos colaboradores aceitos.
    // Portanto, removemos o filtro estrito de .eq('user_id', user.id) da query do banco
    // e fazemos a separação em memória para manter a compatibilidade.
    const { data: rows, error } = await supabase
      .from('lists')
      .select('*, items(id, is_bought)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar listas:', error);
      return [];
    }

    const allLists = (rows || []).map((row: { id: number; title: string; category: string; is_shared: boolean; user_id: string; created_at: string; items: { id: number; is_bought: boolean }[] }) => {
      const items = row.items || [];
      return {
        id: row.id,
        title: row.title,
        category: row.category,
        is_shared: row.is_shared,
        user_id: row.user_id,
        created_at: row.created_at,
        total_items: items.length,
        bought_items: items.filter((i: { is_bought: boolean }) => i.is_bought === true).length,
      };
    });

    if (filter === 'personal') {
      // Listas criadas pelo usuário que NÃO estão compartilhadas
      return allLists.filter(list => list.user_id === user.id && !list.is_shared);
    } else if (filter === 'shared') {
      // Listas marcadas como compartilhadas (onde o usuário é criador mas compartilhou) 
      // OU listas onde o criador é outra pessoa (portanto, ele é colaborador)
      return allLists.filter(list => list.is_shared || list.user_id !== user.id);
    }

    return allLists;
  } catch (error) {
    console.error('Erro ao buscar listas:', error);
    return [];
  }
}

export async function getListDetails(listId: number): Promise<{ list: ShoppingList; items: ListItem[] } | null> {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();

    // Removemos a verificação redundante de .eq('user_id', user.id)
    // para permitir que colaboradores com acesso acessem os detalhes da lista.
    const { data: listRow, error: listError } = await supabase
      .from('lists')
      .select('*, items(id, is_bought)')
      .eq('id', listId)
      .single();

    if (listError || !listRow) return null;

    const { data: itemsRows, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', listId)
      .order('is_bought', { ascending: true })
      .order('id', { ascending: false });

    if (itemsError) {
      console.error('Erro ao buscar itens:', itemsError);
      return null;
    }

    const embeddedItems = listRow.items || [];

    const list: ShoppingList = {
      id: listRow.id,
      title: listRow.title,
      category: listRow.category,
      is_shared: listRow.is_shared,
      user_id: listRow.user_id,
      created_at: listRow.created_at,
      total_items: embeddedItems.length,
      bought_items: embeddedItems.filter((i: { is_bought: boolean }) => i.is_bought === true).length,
    };

    const items: ListItem[] = (itemsRows || []).map((item: { id: number; list_id: number; name: string; quantity: number; estimated_price: string | number; is_bought: boolean }) => ({
      id: item.id,
      list_id: item.list_id,
      name: item.name,
      quantity: item.quantity,
      estimated_price: parseFloat(String(item.estimated_price)) || 0,
      is_bought: item.is_bought,
    }));

    return { list, items };
  } catch (error) {
    console.error('Erro ao obter detalhes da lista:', error);
    return null;
  }
}

export async function createListFromTemplates(
  selectedTemplates: string[],
  customTitle: string,
  isShared: boolean
) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();
    let lastListId: number | null = null;

    for (const template of selectedTemplates) {
      let title = template;
      if (template === 'Criar lista personalizada') {
        title = customTitle.trim() || 'Lista Personalizada';
      }

      const { data: newList, error: insertError } = await supabase
        .from('lists')
        .insert({
          title,
          category: template,
          is_shared: isShared,
          user_id: user.id,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Erro ao criar lista:', insertError);
        return { error: 'Não foi possível criar a(s) lista(s).' };
      }

      if (newList) {
        lastListId = newList.id;
      }
    }

    return { success: true, listId: lastListId };
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    return { error: 'Não foi possível criar a(s) lista(s).' };
  }
}

export async function deleteList(listId: number) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao excluir lista:', error);
      return { error: 'Não foi possível excluir a lista.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir lista:', error);
    return { error: 'Não foi possível excluir a lista.' };
  }
}

// ----------------------------------------------------
// Itens da Lista
// ----------------------------------------------------

export async function toggleItemBought(itemId: number, isBought: boolean) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('items')
      .update({ is_bought: isBought })
      .eq('id', itemId);

    if (error) {
      console.error('Erro ao alterar status do item:', error);
      return { error: 'Não foi possível atualizar o item.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao alterar status do item:', error);
    return { error: 'Não foi possível atualizar o item.' };
  }
}

export async function addListItem(listId: number, name: string, quantity: number, price: number) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();

    // Validar se o usuário tem acesso à lista (o RLS de SELECT já faz o filtro)
    const { data: list } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();

    if (!list) {
      return { error: 'Lista não encontrada ou sem permissão.' };
    }

    const { error } = await supabase
      .from('items')
      .insert({
        list_id: listId,
        name: name.trim(),
        quantity: quantity || 1,
        estimated_price: price || 0.0,
        is_bought: false,
      });

    if (error) {
      console.error('Erro ao adicionar item:', error);
      return { error: 'Não foi possível adicionar o item.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    return { error: 'Não foi possível adicionar o item.' };
  }
}

export async function deleteListItem(itemId: number) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Erro ao excluir item:', error);
      return { error: 'Não foi possível excluir o item.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    return { error: 'Não foi possível excluir o item.' };
  }
}

// ----------------------------------------------------
// Despensa
// ----------------------------------------------------

export async function getPantryItems(): Promise<PantryItem[]> {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();
    const { data: rows, error } = await supabase
      .from('pantry')
      .select('*')
      .eq('user_id', user.id)
      .order('stock_level', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar despensa:', error);
      return [];
    }

    return (rows || []) as PantryItem[];
  } catch (error) {
    console.error('Erro ao buscar despensa:', error);
    return [];
  }
}

export async function replenishPantryItem(pantryId: number) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();

    const { data: item, error: itemError } = await supabase
      .from('pantry')
      .select('*')
      .eq('id', pantryId)
      .eq('user_id', user.id)
      .single();

    if (itemError || !item) return { error: 'Item não encontrado.' };

    // Procurar ou criar a lista de "Reposição de Despensa"
    const { data: existingList } = await supabase
      .from('lists')
      .select('id')
      .eq('title', 'Reposição de Despensa')
      .eq('user_id', user.id)
      .single();

    let listId: number;

    if (existingList) {
      listId = existingList.id;
    } else {
      const { data: newList, error: createError } = await supabase
        .from('lists')
        .insert({
          title: 'Reposição de Despensa',
          category: 'Supermercado',
          is_shared: false,
          user_id: user.id,
        })
        .select('id')
        .single();

      if (createError || !newList) {
        console.error('Erro ao criar lista de reposição:', createError);
        return { error: 'Erro ao processar reposição.' };
      }
      listId = newList.id;
    }

    const { error: addError } = await supabase
      .from('items')
      .insert({
        list_id: listId,
        name: item.name,
        quantity: 1,
        estimated_price: 0.0,
        is_bought: false,
      });

    if (addError) {
      console.error('Erro ao adicionar item de reposição:', addError);
      return { error: 'Erro ao processar reposição.' };
    }

    return { success: true, listId };
  } catch (error) {
    console.error('Erro ao repor item:', error);
    return { error: 'Erro ao processar reposição.' };
  }
}

export async function updatePantryStock(pantryId: number, level: 'Cheio' | 'Baixo' | 'Em Falta') {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('pantry')
      .update({ stock_level: level })
      .eq('id', pantryId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao atualizar despensa:', error);
      return { error: 'Não foi possível atualizar o estoque.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar despensa:', error);
    return { error: 'Não foi possível atualizar o estoque.' };
  }
}

// ----------------------------------------------------
// Colaboração e Compartilhamento de Listas
// ----------------------------------------------------

/**
 * Convida um colaborador para a lista de compras pelo e-mail.
 */
export async function inviteCollaborator(listId: number, email: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return { error: 'E-mail é obrigatório.' };

  try {
    const supabase = await createServerClient();

    // 1. Validar se a lista pertence ao usuário atual (apenas o dono pode convidar)
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id, title')
      .eq('id', listId)
      .single();

    if (listError || !list) {
      return { error: 'Lista não encontrada.' };
    }

    if (list.user_id !== user.id) {
      return { error: 'Apenas o proprietário pode convidar colaboradores.' };
    }

    if (user.email.toLowerCase() === trimmedEmail) {
      return { error: 'Você não pode se convidar para sua própria lista.' };
    }

    // 2. Chamar o RPC para buscar o ID do usuário cadastrado se ele existir
    const { data: userData, error: rpcError } = await supabase
      .rpc('get_user_by_email', { email_to_search: trimmedEmail });

    if (rpcError) {
      console.error('Erro RPC get_user_by_email:', rpcError);
    }

    const invitedUser = userData && userData.length > 0 ? userData[0] : null;

    // 3. Inserir o convite na tabela list_collaborators
    const { error: inviteError } = await supabase
      .from('list_collaborators')
      .insert({
        list_id: listId,
        user_id: invitedUser ? invitedUser.id : null,
        invited_email: trimmedEmail,
        status: 'pending',
        role: 'editor',
      });

    if (inviteError) {
      console.error('Erro ao inserir convite:', inviteError);
      if (inviteError.message.includes('unique_conflict') || inviteError.message.includes('duplicate key') || inviteError.message.includes('already exists')) {
        return { error: 'Este e-mail já foi convidado para esta lista.' };
      }
      return { error: 'Erro ao enviar convite. Tente novamente.' };
    }

    // 4. Marcar a lista como compartilhada
    await supabase
      .from('lists')
      .update({ is_shared: true })
      .eq('id', listId);

    return { success: true, isNewUser: !invitedUser };
  } catch (error) {
    console.error('Erro ao convidar colaborador:', error);
    return { error: 'Erro interno ao processar convite.' };
  }
}

/**
 * Busca os convites pendentes recebidos pelo usuário logado.
 */
export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('list_collaborators')
      .select(`
        id,
        status,
        lists (
          id,
          title,
          profiles (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Erro ao buscar convites pendentes:', error);
      return [];
    }

    return (data || []) as unknown as PendingInvitation[];
  } catch (error) {
    console.error('Erro ao buscar convites pendentes:', error);
    return [];
  }
}

/**
 * Aceita ou recusa um convite de colaboração.
 */
export async function respondToInvitation(inviteId: number, accept: boolean) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();

    if (accept) {
      const { error } = await supabase
        .from('list_collaborators')
        .update({ status: 'accepted' })
        .eq('id', inviteId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao aceitar convite:', error);
        return { error: 'Não foi possível aceitar o convite.' };
      }
    } else {
      const { error } = await supabase
        .from('list_collaborators')
        .delete()
        .eq('id', inviteId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao recusar convite:', error);
        return { error: 'Não foi possível recusar o convite.' };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao responder ao convite:', error);
    return { error: 'Erro interno ao responder convite.' };
  }
}

/**
 * Busca todos os colaboradores de uma lista de compras específica.
 */
export async function getListCollaborators(listId: number): Promise<Collaborator[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('list_collaborators')
      .select(`
        id,
        list_id,
        user_id,
        invited_email,
        role,
        status,
        profiles (
          name,
          avatar_url
        )
      `)
      .eq('list_id', listId);

    if (error) {
      console.error('Erro ao buscar colaboradores:', error);
      return [];
    }

    return (data || []) as unknown as Collaborator[];
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    return [];
  }
}

/**
 * Remove um colaborador de uma lista (apenas dono da lista pode fazer isso).
 */
export async function removeCollaborator(listId: number, collaboratorId: number) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const supabase = await createServerClient();

    // 1. Validar se o usuário logado é o proprietário da lista ou o próprio colaborador
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', listId)
      .single();

    if (listError || !list) {
      return { error: 'Lista não encontrada.' };
    }

    if (list.user_id !== user.id) {
      // Se não for o dono, vamos verificar se o próprio colaborador está se auto-removendo
      const { data: collab } = await supabase
        .from('list_collaborators')
        .select('user_id')
        .eq('id', collaboratorId)
        .single();

      if (!collab || collab.user_id !== user.id) {
        return { error: 'Apenas o proprietário ou o próprio colaborador podem remover o acesso.' };
      }
    }

    // 2. Deletar da tabela list_collaborators
    const { error: deleteError } = await supabase
      .from('list_collaborators')
      .delete()
      .eq('id', collaboratorId)
      .eq('list_id', listId);

    if (deleteError) {
      console.error('Erro ao deletar colaborador:', deleteError);
      return { error: 'Não foi possível remover o colaborador.' };
    }

    // 3. Opcional: Se não sobrou nenhum colaborador, reverter is_shared para false
    const { count } = await supabase
      .from('list_collaborators')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId);

    if (count === 0) {
      await supabase
        .from('lists')
        .update({ is_shared: false })
        .eq('id', listId);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao remover colaborador:', error);
    return { error: 'Erro interno ao remover colaborador.' };
  }
}
