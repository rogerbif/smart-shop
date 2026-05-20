import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltam as variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local'
  );
}

// Cliente server-side para comunicação com o PostgreSQL do Supabase
// Usa service_role_key pois todas as queries rodam em Server Actions (Node.js)
export const supabase = createClient(supabaseUrl, supabaseKey);
