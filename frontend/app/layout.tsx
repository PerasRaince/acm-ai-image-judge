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
  title: 'ACM Student Chapter | AI Image Judge Platform',
  description: 'Deterministic AI image recreation competition platform organized by the Institutional ACM Student Chapter (Association for Computing Machinery). Powered by DreamSim, DINOv2, OpenCLIP, and LPIPS.',
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
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-blue-600/30 selection:text-blue-300">
        <ScreenshotProtection />
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
