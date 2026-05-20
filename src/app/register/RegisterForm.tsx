'use client';

import { useState, useTransition } from 'react';
import { register } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import InputField from '@/components/molecules/InputField';
import Button from '@/components/atoms/Button';

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    startTransition(async () => {
      const res = await register(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    });
  };

  return (
    <div className="login-view animate-fade-in">
      {/* Bloco de Logo Centrado (Fiel à Imagem) */}
      <div className="login-logo-block">
        <div className="login-logo-cart">
          <svg viewBox="0 0 100 90" width="65" height="58" xmlns="http://www.w3.org/2000/svg">
            {/* Lâmpada verde acesa dentro do carrinho */}
            <path d="M52,18 C45.4,18 40,23.4 40,30 C40,34.5 42.5,38.5 46,40.5 L46,46 C46,47.1 46.9,48 48,48 L56,48 C57.1,48 58,47.1 58,46 L58,40.5 C61.5,38.5 64,34.5 64,30 Z" fill="#72E2A5" stroke="#102A43" strokeWidth="4.5" strokeLinejoin="round" />
            <path d="M47,52 L57,52" stroke="#102A43" strokeWidth="4" strokeLinecap="round" />
            <path d="M49,56 L55,56" stroke="#102A43" strokeWidth="4" strokeLinecap="round" />
            {/* Raios da lâmpada */}
            <line x1="52" y1="8" x2="52" y2="13" stroke="#102A43" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="36" y1="14" x2="41" y2="19" stroke="#102A43" strokeWidth="4" strokeLinecap="round" />
            <line x1="68" y1="14" x2="63" y2="19" stroke="#102A43" strokeWidth="4" strokeLinecap="round" />
            <line x1="30" y1="30" x2="35" y2="30" stroke="#102A43" strokeWidth="4" strokeLinecap="round" />
            <line x1="74" y1="30" x2="69" y2="30" stroke="#102A43" strokeWidth="4" strokeLinecap="round" />
            
            {/* Estrutura do Carrinho de Compras */}
            <path d="M12,24 L19,24 L30,58 L76,58" fill="none" stroke="#102A43" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M28,32 L84,32 C85.5,32 86.5,33.5 86,35 L79.5,52 C79,53 78,53.5 77,53.5 L29,53.5" fill="none" stroke="#102A43" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Rodinhas */}
            <circle cx="36" cy="70" r="7.5" fill="#102A43" />
            <circle cx="70" cy="70" r="7.5" fill="#102A43" />
          </svg>
        </div>
        <div className="login-logo-text">
          <span className="login-logo-text-smart">SMART</span>
          <span className="login-logo-text-shop">SHOP</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        {error && (
          <div className="error-banner" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Campo Usuário */}
        <InputField
          label="Usuário"
          variant="login"
          type="email"
          id="email"
          name="email"
          placeholder="Informe seu usuário"
          required
        />

        {/* Campo Senha */}
        <InputField
          label="Senha"
          variant="login"
          type="password"
          id="password"
          name="password"
          placeholder="Informe sua senha"
          required
        />

        {/* Campo Repetir Senha */}
        <InputField
          label="Repetir Senha"
          variant="login"
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Repita sua senha"
          required
        />

        {/* Botão Cadastrar (Pill verde) */}
        <Button
          type="submit"
          className="login-btn-submit"
          isPending={isPending}
          style={{ marginTop: '20px' }}
        >
          Cadastrar
        </Button>

        {/* Link Já tem conta? Logar Centrado no rodapé */}
        <div className="login-create-link-container">
          <Link href="/" className="login-create-link">
            Já tem conta? Logar
          </Link>
        </div>
      </form>
    </div>
  );
}
