import '@/app/globals.css';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="app-shell relative grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-[#10254f] via-[#0d3d77] to-[#1c7aa7]" />
        <div className="absolute left-8 top-8 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
          CLB Cau Long
        </div>
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
          <h1 className="max-w-md text-5xl font-semibold leading-tight">
            Van hanh cau lac bo gon gang, ro rang, de mo rong.
          </h1>
          <p className="mt-5 max-w-md text-base text-sky-100/95">
            Theo doi thanh vien, buoi tap va quyet toan trong mot he thong nhat quan,
            toi uu cho nguoi quan ly CLB.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
