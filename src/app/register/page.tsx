import { getCurrentUser } from '@/lib/actions';
import { redirect } from 'next/navigation';
import RegisterForm from './RegisterForm';

export default async function Page() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return <RegisterForm />;
}
