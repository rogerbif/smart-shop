import { getCurrentUser, getListDetails } from '@/lib/actions';
import { redirect } from 'next/navigation';
import ListDetailClient from './ListDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  // Await the params for Next.js 15+ compatibility
  const resolvedParams = await params;
  const listId = parseInt(resolvedParams.id);

  if (isNaN(listId)) {
    redirect('/dashboard');
  }

  const data = await getListDetails(listId);

  if (!data) {
    redirect('/dashboard');
  }

  return <ListDetailClient list={data.list} items={data.items} />;
}
