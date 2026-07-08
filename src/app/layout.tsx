import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'אתוס – דילמות מוסריות',
  description: 'האם אתה יודע מה הדבר הנכון לעשות? הצביעו בדילמות מוסריות ומדדו את עצמכם אל מול האחרים.',
  openGraph: {
    title: 'אתוס – דילמות מוסריות',
    description: 'הצביעו בדילמות מוסריות ומדדו את עצמכם אל מול האחרים.',
    locale: 'he_IL',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="bg-zinc-950 text-white font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
