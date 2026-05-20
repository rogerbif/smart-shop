import { getCurrentUser } from '@/lib/actions';
import { redirect } from 'next/navigation';
import CreateClient from './CreateClient';

export default async function CreatePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return <CreateClient />;
}
