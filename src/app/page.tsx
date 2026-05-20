import { getCurrentUser } from '@/lib/actions';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function Page() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
