import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Analytics from "@/components/Analytics";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s — SmartLine",
    default: "SmartLine — інтернет-магазин електроніки",
  },
  description: "SmartLine — магазин перевіреної техніки в Івано-Франківську. Ноутбуки Dell, Lenovo, HP, ASUS з гарантією. Доставка Новою Поштою по всій Україні.",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '64x64' },
    ],
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="h-full" suppressHydrationWarning>
      <head>
        {/* Runs before first paint — reads theme from localStorage and applies class to <html>
            to prevent a flash of the wrong theme on page load. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('smartline-theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}else{document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          {children}
          <Toaster richColors position="top-right" closeButton />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
