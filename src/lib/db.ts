import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');

// Garantir que a pasta 'data' exista para persistência no Docker/Local
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Habilitar chaves estrangeiras
db.pragma('foreign_keys = ON');

// Inicializar tabelas se elas não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar_url TEXT
  );

  CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    is_shared INTEGER DEFAULT 0,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    estimated_price REAL DEFAULT 0.0,
    is_bought INTEGER DEFAULT 0,
    FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS pantry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stock_level TEXT CHECK(stock_level IN ('Cheio', 'Baixo', 'Em Falta')) NOT NULL,
    quantity TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

// Seed de dados iniciais para demonstração se a tabela 'users' estiver vazia
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

if (userCount.count === 0) {
  // Criar usuários de demonstração
  const insertUser = db.prepare('INSERT INTO users (name, email, password, avatar_url) VALUES (?, ?, ?, ?)');
  insertUser.run('Ana Silva', 'ana@smartshop.com', '123456', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
  insertUser.run('Carlos Oliveira', 'carlos@smartshop.com', '123456', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');

  // Obter IDs dos usuários criados
  const userAna = db.prepare('SELECT id FROM users WHERE email = ?').get('ana@smartshop.com') as { id: number };
  const userCarlos = db.prepare('SELECT id FROM users WHERE email = ?').get('carlos@smartshop.com') as { id: number };

  // Criar listas iniciais para Ana (Pessoais)
  const insertList = db.prepare('INSERT INTO lists (title, category, is_shared, user_id) VALUES (?, ?, ?, ?)');
  
  // Lista 1: Farmácia (Ana)
  const listFarmacia = insertList.run('Farmácia Mensal', 'Farmácia', 0, userAna.id);
  // Lista 2: Livros de UX/UI (Ana)
  const listLivros = insertList.run('Livros de UX/UI', 'Coisas que quero comprar', 0, userAna.id);
  // Lista 3: Supermercado (Compartilhada Ana & Carlos)
  const listSupermercado = insertList.run('Supermercado Semanal', 'Supermercado', 1, userAna.id);

  // Inserir itens nas listas
  const insertItem = db.prepare('INSERT INTO items (list_id, name, quantity, estimated_price, is_bought) VALUES (?, ?, ?, ?, ?)');
  
  // Farmácia (2/3 comprados)
  insertItem.run(listFarmacia.lastInsertRowid, 'Vitamina C', 1, 35.0, 1);
  insertItem.run(listFarmacia.lastInsertRowid, 'Protetor Solar', 1, 79.9, 1);
  insertItem.run(listFarmacia.lastInsertRowid, 'Antialérgico', 2, 18.5, 0);

  // Livros UX/UI (0/2 comprados)
  insertItem.run(listLivros.lastInsertRowid, 'Designing Interfaces', 1, 145.0, 0);
  insertItem.run(listLivros.lastInsertRowid, 'Don\'t Make Me Think', 1, 95.0, 0);

  // Supermercado (3/5 comprados)
  insertItem.run(listSupermercado.lastInsertRowid, 'Leite Integral', 4, 5.5, 1);
  insertItem.run(listSupermercado.lastInsertRowid, 'Pão de Forma', 2, 8.9, 1);
  insertItem.run(listSupermercado.lastInsertRowid, 'Café Torrado', 1, 19.9, 1);
  insertItem.run(listSupermercado.lastInsertRowid, 'Arroz 5kg', 1, 26.5, 0);
  insertItem.run(listSupermercado.lastInsertRowid, 'Maçã Gala 1kg', 1, 12.0, 0);

  // Seed de Despensa para Ana
  const insertPantry = db.prepare('INSERT INTO pantry (name, stock_level, quantity, user_id) VALUES (?, ?, ?, ?)');
  insertPantry.run('Azeite de Oliva', 'Baixo', '1 garrafa (200ml)', userAna.id);
  insertPantry.run('Açúcar Refinado', 'Em Falta', '0 kg', userAna.id);
  insertPantry.run('Feijão Carioca', 'Cheio', '3 pacotes', userAna.id);
  insertPantry.run('Detergente Neutro', 'Baixo', '1 unidade', userAna.id);

  // Seed de Despensa para Carlos
  insertPantry.run('Leite Condensado', 'Em Falta', '0 caixas', userCarlos.id);
  insertPantry.run('Café em Pó', 'Cheio', '2 pacotes', userCarlos.id);
}

export default db;
