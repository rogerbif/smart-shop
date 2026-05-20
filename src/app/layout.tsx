import type { Metadata } from 'next';
import './globals.css';
import { getCurrentUser } from '@/lib/actions';
import Header from '@/components/organisms/Header';
import BottomNav from '@/components/organisms/BottomNav';

export const metadata: Metadata = {
  title: 'SmartShop - Comprar nunca foi tão fácil',
  description: 'Otimize seu tempo em compras e mantenha o controle financeiro da sua casa em tempo real.',
  keywords: 'lista de compras, supermercado, despensa, orçamento doméstico, finanças pessoais',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body>
        <div className="mobile-wrapper">
          <div className="mobile-container">
            <Header user={user} />
            {children}
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
