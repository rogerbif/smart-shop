'use server';

import db from './db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ShoppingList {
  id: number;
  title: string;
  category: string;
  is_shared: boolean;
  user_id: number;
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
  user_id: number;
}

// ----------------------------------------------------
// Autenticação
// ----------------------------------------------------

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' };
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user || user.password !== password) {
      return { error: 'E-mail ou senha incorretos.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('auth_user_id', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro no login:', error);
    return { error: 'Erro interno ao realizar login.' };
  }
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !password || !confirmPassword) {
    return { error: 'Todos os campos são obrigatórios.' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' };
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;

    if (existingUser) {
      return { error: 'Este e-mail/usuário já está cadastrado.' };
    }

    const namePrefix = email.split('@')[0];
    const name = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);
    const avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100';

    const info = db.prepare('INSERT INTO users (name, email, password, avatar_url) VALUES (?, ?, ?, ?)').run(
      name,
      email,
      password,
      avatarUrl
    );

    const cookieStore = await cookies();
    cookieStore.set('auth_user_id', info.lastInsertRowid.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro no cadastro:', error);
    return { error: 'Erro interno ao realizar cadastro.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_user_id');
  redirect('/');
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get('auth_user_id')?.value;

  if (!userIdStr) return null;

  try {
    const user = db.prepare('SELECT id, name, email, avatar_url FROM users WHERE id = ?').get(parseInt(userIdStr)) as User | undefined;
    return user || null;
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

  let query = `
    SELECT 
      l.*,
      COUNT(i.id) as total_items,
      SUM(CASE WHEN i.is_bought = 1 THEN 1 ELSE 0 END) as bought_items
    FROM lists l
    LEFT JOIN items i ON l.id = i.list_id
    WHERE l.user_id = ?
  `;

  const params: any[] = [user.id];

  if (filter === 'personal') {
    query += ` AND l.is_shared = 0`;
  } else if (filter === 'shared') {
    query += ` AND l.is_shared = 1`;
  }

  query += ` GROUP BY l.id ORDER BY l.created_at DESC`;

  try {
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(row => ({
      ...row,
      is_shared: row.is_shared === 1,
      total_items: row.total_items || 0,
      bought_items: row.bought_items || 0,
    }));
  } catch (error) {
    console.error('Erro ao buscar listas:', error);
    return [];
  }
}

export async function getListDetails(listId: number): Promise<{ list: ShoppingList; items: ListItem[] } | null> {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const listRow = db.prepare(`
      SELECT 
        l.*,
        COUNT(i.id) as total_items,
        SUM(CASE WHEN i.is_bought = 1 THEN 1 ELSE 0 END) as bought_items
      FROM lists l
      LEFT JOIN items i ON l.id = i.list_id
      WHERE l.id = ? AND l.user_id = ?
      GROUP BY l.id
    `).get(listId, user.id) as any;

    if (!listRow) return null;

    const itemsRows = db.prepare(`
      SELECT * FROM items WHERE list_id = ? ORDER BY is_bought ASC, id DESC
    `).all(listId) as any[];

    const list: ShoppingList = {
      ...listRow,
      is_shared: listRow.is_shared === 1,
      total_items: listRow.total_items || 0,
      bought_items: listRow.bought_items || 0,
    };

    const items: ListItem[] = itemsRows.map(item => ({
      ...item,
      is_bought: item.is_bought === 1,
    }));

    return { list, items };
  } catch (error) {
    console.error('Erro ao obter detalhes da lista:', error);
    return null;
  }
}

const TEMPLATE_ITEMS: Record<string, { name: string; quantity: number; price: number }[]> = {
  'Eventos': [
    { name: 'Copos descartáveis', quantity: 2, price: 8.5 },
    { name: 'Refrigerante 2L', quantity: 4, price: 9.0 },
    { name: 'Pratinhos descartáveis', quantity: 1, price: 12.0 },
    { name: 'Carvão 5kg', quantity: 1, price: 29.9 },
    { name: 'Gelo escama', quantity: 2, price: 15.0 },
  ],
  'Supermercado': [
    { name: 'Leite Integral', quantity: 4, price: 5.5 },
    { name: 'Pão de Forma', quantity: 2, price: 8.9 },
    { name: 'Café Torrado', quantity: 1, price: 19.9 },
    { name: 'Arroz 5kg', quantity: 1, price: 26.5 },
    { name: 'Feijão Preto', quantity: 2, price: 9.8 },
  ],
  'Farmácia': [
    { name: 'Analgésico', quantity: 1, price: 12.5 },
    { name: 'Algodão', quantity: 1, price: 6.9 },
    { name: 'Curativo (Band-Aid)', quantity: 1, price: 9.9 },
    { name: 'Álcool em gel', quantity: 1, price: 11.5 },
  ],
  'Material Escolar': [
    { name: 'Caderno 10 matérias', quantity: 1, price: 24.9 },
    { name: 'Caneta azul', quantity: 3, price: 2.2 },
    { name: 'Lápis de escrever', quantity: 3, price: 1.5 },
    { name: 'Borracha escolar', quantity: 1, price: 3.5 },
  ],
  'Coisas que quero comprar': [
    { name: 'Livro Novo', quantity: 1, price: 59.9 },
    { name: 'Fone de ouvido sem fio', quantity: 1, price: 189.9 },
    { name: 'Camiseta preta basica', quantity: 2, price: 49.9 },
  ],
};

export async function createListFromTemplates(
  selectedTemplates: string[],
  customTitle: string,
  isShared: boolean
) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    const insertList = db.prepare('INSERT INTO lists (title, category, is_shared, user_id) VALUES (?, ?, ?, ?)');

    let lastListId: number | bigint | null = null;

    // Inserir as listas para cada template selecionado (mantendo-as totalmente vazias)
    for (const template of selectedTemplates) {
      let title = template;
      if (template === 'Criar lista personalizada') {
        title = customTitle.trim() || 'Lista Personalizada';
      }

      const info = insertList.run(title, template, isShared ? 1 : 0, user.id);
      lastListId = info.lastInsertRowid;
    }

    return { success: true, listId: lastListId ? Number(lastListId) : null };
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    return { error: 'Não foi possível criar a(s) lista(s).' };
  }
}

export async function deleteList(listId: number) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    db.prepare('DELETE FROM lists WHERE id = ? AND user_id = ?').run(listId, user.id);
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
    db.prepare(`
      UPDATE items 
      SET is_bought = ? 
      WHERE id = ? AND list_id IN (SELECT id FROM lists WHERE user_id = ?)
    `).run(isBought ? 1 : 0, itemId, user.id);
    
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
    // Validar se a lista pertence ao usuário
    const list = db.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').get(listId, user.id);
    if (!list) {
      return { error: 'Lista não encontrada ou sem permissão.' };
    }

    db.prepare(`
      INSERT INTO items (list_id, name, quantity, estimated_price, is_bought)
      VALUES (?, ?, ?, ?, 0)
    `).run(listId, name.trim(), quantity || 1, price || 0.0);

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
    db.prepare(`
      DELETE FROM items 
      WHERE id = ? AND list_id IN (SELECT id FROM lists WHERE user_id = ?)
    `).run(itemId, user.id);
    
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
    const rows = db.prepare('SELECT * FROM pantry WHERE user_id = ? ORDER BY stock_level DESC, name ASC').all(user.id) as PantryItem[];
    return rows;
  } catch (error) {
    console.error('Erro ao buscar despensa:', error);
    return [];
  }
}

export async function replenishPantryItem(pantryId: number) {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    // 1. Buscar detalhes do item da despensa
    const item = db.prepare('SELECT * FROM pantry WHERE id = ? AND user_id = ?').get(pantryId, user.id) as PantryItem | undefined;
    if (!item) return { error: 'Item não encontrado.' };

    // 2. Procurar ou criar uma lista de "Reposição de Despensa"
    let list = db.prepare('SELECT id FROM lists WHERE title = ? AND user_id = ?').get('Reposição de Despensa', user.id) as { id: number } | undefined;
    if (!list) {
      const info = db.prepare('INSERT INTO lists (title, category, is_shared, user_id) VALUES (?, ?, ?, ?)').run(
        'Reposição de Despensa',
        'Supermercado',
        0,
        user.id
      );
      list = { id: Number(info.lastInsertRowid) };
    }

    // 3. Adicionar o item à lista de compras
    db.prepare(`
      INSERT INTO items (list_id, name, quantity, estimated_price, is_bought)
      VALUES (?, ?, 1, 0.0, 0)
    `).run(list.id, item.name);

    // 4. Mudar nível na despensa temporariamente ou após compra (neste caso atualizamos para 'Baixo' ou deixamos a encargo do fluxo)
    return { success: true, listId: list.id };
  } catch (error) {
    console.error('Erro ao repor item:', error);
    return { error: 'Erro ao processar reposição.' };
  }
}

export async function updatePantryStock(pantryId: number, level: 'Cheio' | 'Baixo' | 'Em Falta') {
  const user = await getCurrentUser();
  if (!user) redirect('/');

  try {
    db.prepare('UPDATE pantry SET stock_level = ? WHERE id = ? AND user_id = ?').run(level, pantryId, user.id);
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar despensa:', error);
    return { error: 'Não foi possível atualizar o estoque.' };
  }
}
