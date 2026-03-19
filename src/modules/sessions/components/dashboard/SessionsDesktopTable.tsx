import Link from "next/link";

import { DashboardMonth, DashboardSession } from "@/modules/sessions/hooks/useSessionsDashboard";

interface SessionsDesktopTableProps {
  sessions: DashboardSession[];
  users: Array<{ id: string; name: string }>;
  authRole?: string;
  selectedMonthData?: DashboardMonth;
  onCloseSession: (sessionId: number) => Promise<void>;
}

export function SessionsDesktopTable({
  sessions,
  users,
  authRole,
  selectedMonthData,
  onCloseSession,
}: SessionsDesktopTableProps) {
  return (
    <div className="surface-card overflow-hidden hidden lg:block">
      <table className="data-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Chi phí sân</th>
            <th>Người trả</th>
            <th>Ghi chú</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td className="font-medium">{new Date(session.session_date).toLocaleDateString("vi-VN")}</td>
              <td className="font-semibold text-[var(--foreground)]">
                {session.court_expense_amount.toLocaleString("vi-VN")} đ
              </td>
              <td className="text-[var(--muted)]">
                {users.find((user) => user.id === session.payer_user_id)?.name ||
                  session.payer_user_id.substring(0, 8)}
              </td>
              <td className="text-[var(--muted)]">{session.notes || "—"}</td>
              <td>
                <span className={`badge ${session.status === "open" ? "badge-success" : "badge-neutral"}`}>
                  {session.status === "open" ? "Đang mở" : "Đã đóng"}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/sessions/${session.id}`}
                    className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
                  >
                    {session.status === "closed" || selectedMonthData?.status === "closed"
                      ? "Xem điểm danh"
                      : "Điểm danh"}
                  </Link>
                  {authRole === "admin" &&
                    session.status === "open" &&
                    selectedMonthData?.status === "open" && (
                      <button
                        onClick={() => {
                          if (!confirm("Bạn có chắc muốn đóng buổi tập này? Sau khi đóng sẽ không thể sửa điểm danh.")) {
                            return;
                          }
                          void onCloseSession(session.id);
                        }}
                        className="text-sm font-medium text-[var(--warning)] hover:text-amber-800 cursor-pointer"
                      >
                        Đóng buổi
                      </button>
                    )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sessions.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-title">Chưa có buổi tập nào trong kỳ này</p>
        </div>
      )}
    </div>
  );
}
