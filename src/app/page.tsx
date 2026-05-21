import LoginForm from './LoginForm';

// O middleware já redireciona usuários autenticados para /dashboard
export default function Page() {
  return <LoginForm />;
}
