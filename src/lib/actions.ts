'use server';

import { createServerClient, createAdminClient } from './supabase';
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error) {
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
    let query = supabase
      .from('lists')
      .select('*, items(id, is_bought)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filter === 'personal') {
      query = query.eq('is_shared', false);
    } else if (filter === 'shared') {
      query = query.eq('is_shared', true);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Erro ao buscar listas:', error);
      return [];
    }

    return (rows || []).map((row: any) => {
      const items = row.items || [];
      return {
        id: row.id,
        title: row.title,
        category: row.category,
        is_shared: row.is_shared,
        user_id: row.user_id,
        created_at: row.created_at,
        total_items: items.length,
        bought_items: items.filter((i: any) => i.is_bought === true).length,
      };
    });
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

    const { data: listRow, error: listError } = await supabase
      .from('lists')
      .select('*, items(id, is_bought)')
      .eq('id', listId)
      .eq('user_id', user.id)
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
      bought_items: embeddedItems.filter((i: any) => i.is_bought === true).length,
    };

    const items: ListItem[] = (itemsRows || []).map((item: any) => ({
      id: item.id,
      list_id: item.list_id,
      name: item.name,
      quantity: item.quantity,
      estimated_price: parseFloat(item.estimated_price) || 0,
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

    // Validar se a lista pertence ao usuário (RLS já faz isso, mas validamos explicitamente)
    const { data: list } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', user.id)
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
