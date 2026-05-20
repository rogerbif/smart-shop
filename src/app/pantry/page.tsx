import { getCurrentUser, getPantryItems } from '@/lib/actions';
import { redirect } from 'next/navigation';
import PantryClient from './PantryClient';

export default async function PantryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const items = await getPantryItems();

  return <PantryClient items={items} />;
}
