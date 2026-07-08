import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ethos: The Ultimate Debate',
  description: 'Pick a side. See where the world stands. Vote on moral dilemmas and compare yourself to everyone else.',
  openGraph: {
    title: 'Ethos: The Ultimate Debate',
    description: 'Pick a side. See where the world stands.',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-zinc-950 text-white font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
