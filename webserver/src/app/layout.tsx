import type { Metadata } from 'next';
import './globals.css';
import './redesign.css';


export const metadata: Metadata = {
  title: 'Elo Ranking - LOLRanking',
  description: 'Ranking y estadísticas del grupo de amigos en League of Legends',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
