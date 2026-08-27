import type { Metadata } from 'next';
import { Marcellus, Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';

const marcellus = Marcellus({ variable: '--font-marcellus', subsets: ['latin'], weight: '400' });
const barlow = Barlow({ variable: '--font-barlow', subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Elo Ranking - LOLRanking',
  description: 'Ranking y estadísticas del grupo de amigos en League of Legends',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${marcellus.variable} ${barlow.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
