import Link from "next/link";

import { MemberUser } from "@/modules/users/types";
import {
  getApprovalBadgeClass,
  getApprovalLabel,
} from "@/modules/users/lib/members-utils";

interface MembersDesktopTableProps {
  members: MemberUser[];
  isAdmin: boolean;
  approvalProcessingId: string | null;
  onApprovalAction: (memberId: string, action: "approve" | "reject") => Promise<void>;
}

export function MembersDesktopTable({
  members,
  isAdmin,
  approvalProcessingId,
  onApprovalAction,
}: MembersDesktopTableProps) {
  return (
    <div className="surface-card overflow-hidden hidden lg:block">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Username</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Vai trò</th>
              <th>Số dư</th>
              <th>Trạng thái</th>
              <th>Duyệt TK</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td className="font-medium">{member.name}</td>
                <td className="font-mono text-sm text-[var(--muted)]">{member.username}</td>
                <td className="text-[var(--muted)]">{member.email}</td>
                <td>{member.phone}</td>
                <td>
                  <span className={`badge ${member.role === "admin" ? "badge-primary" : "badge-neutral"}`}>
                    {member.role === "admin" ? "Quản trị" : "Thành viên"}
                  </span>
                </td>
                <td className="font-medium">
                  <span className={member.balance >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
                    {member.balance.toLocaleString("vi-VN")} đ
                  </span>
                </td>
                <td>
                  <span className={`badge ${member.is_active ? "badge-success" : "badge-neutral"}`}>
                    {member.is_active ? "Hoạt động" : "Ngừng"}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getApprovalBadgeClass(member.approval_status)}`}>
                    {getApprovalLabel(member.approval_status)}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    {isAdmin && member.approval_status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="text-xs font-semibold text-emerald-700 disabled:opacity-40"
                          disabled={approvalProcessingId === member.id}
                          onClick={() => onApprovalAction(member.id, "approve")}
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-700 disabled:opacity-40"
                          disabled={approvalProcessingId === member.id}
                          onClick={() => onApprovalAction(member.id, "reject")}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    <Link
                      href={`/dashboard/members/${member.id}`}
                      className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
