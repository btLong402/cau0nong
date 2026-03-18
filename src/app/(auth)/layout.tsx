import '@/app/globals.css';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <html lang="vi">
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          {children}
        </div>
      </body>
    </html>
  );
}
