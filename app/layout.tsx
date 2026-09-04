import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Recovery Loop — Revenue recovery operations',
  description: 'A refusal-aware payment recovery agent that protects retry budgets and recovers more revenue.',
  openGraph: {
    title: 'Recovery Loop',
    description: 'Recover more revenue. Waste fewer attempts.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Recovery Loop payment recovery dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recovery Loop',
    description: 'Recover more revenue. Waste fewer attempts.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('rl-intro')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-intro','seen')}}catch(e){}",
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
