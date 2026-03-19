import Link from "next/link";

import { DashboardSession } from "@/modules/sessions/hooks/useSessionsDashboard";

interface SessionsMobileListProps {
  sessions: DashboardSession[];
  users: Array<{ id: string; name: string }>;
}

export function SessionsMobileList({ sessions, users }: SessionsMobileListProps) {
  return (
    <div className="card-list lg:hidden">
      {sessions.map((session) => (
        <div key={session.id} className="card-list-item">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {new Date(session.session_date).toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "numeric",
                  month: "numeric",
                })}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {users.find((user) => user.id === session.payer_user_id)?.name || "—"}
                {session.notes ? ` • ${session.notes}` : ""}
              </p>
            </div>
            <span className={`badge ${session.status === "open" ? "badge-success" : "badge-neutral"}`}>
              {session.status === "open" ? "Mở" : "Đóng"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-[var(--foreground)]">
              {session.court_expense_amount.toLocaleString("vi-VN")} đ
            </p>
            <Link
              href={`/dashboard/sessions/${session.id}`}
              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
            >
              {session.status === "closed" ? "Xem" : "Điểm danh →"}
            </Link>
          </div>
        </div>
      ))}

      {sessions.length === 0 && (
        <div className="empty-state py-8">
          <p className="empty-state-title">Chưa có buổi tập nào</p>
        </div>
      )}
    </div>
  );
}
