import { getCurrentUser, getLists } from '@/lib/actions';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  // Buscar todas as listas inicialmente no servidor
  const lists = await getLists('all');

  return <DashboardClient initialLists={lists} />;
}
