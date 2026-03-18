'use client';

interface SettlementsErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SettlementsErrorPage({ error, reset }: SettlementsErrorPageProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
      <h2 className="text-lg font-semibold">Không thể tải trang quyết toán</h2>
      <p className="mt-2 text-sm">
        {error.message || 'Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.'}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Thử lại
        </button>
        <a
          href="/dashboard/months"
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
        >
          Về kỳ quản lý
        </a>
      </div>
    </div>
  );
}
