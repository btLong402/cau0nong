import '@/app/globals.css';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="app-shell relative grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-[#134E4A] via-[#0D9488] to-[#059669]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute left-8 top-8 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
          <img src="/favicon.svg" alt="CLB Logo" className="h-6 w-6" />
          CLB Cầu Lông
        </div>
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
            Vận hành câu lạc bộ gọn gàng, rõ ràng, dễ mở rộng.
          </h1>
          <p className="mt-4 max-w-md text-base text-teal-100/90 leading-relaxed">
            Theo dõi thành viên, buổi tập và quyết toán trong một hệ thống nhất quán,
            tối ưu cho người quản lý CLB.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
