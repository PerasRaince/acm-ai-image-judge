import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ScreenshotProtection } from '../components/ScreenshotProtection';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ACM Student Chapter GEC Thrissur | Orientation AI Image Recreation Competition',
  description: 'Official AI Image Recreation Competition platform organized for the ACM Student Chapter Orientation at Government Engineering College Thrissur (GEC Thrissur). Powered by an automated 6-metric PyTorch vision evaluation ensemble.',
  icons: {
    icon: '/acm-icon.png',
    shortcut: '/acm-icon.png',
    apple: '/acm-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#071527] text-slate-100 selection:bg-[#0085CA]/30 selection:text-sky-300">
        <ScreenshotProtection />
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
