import Link from "next/link";

import { MemberUser } from "@/modules/users/types";
import {
  getApprovalBadgeClass,
  getApprovalLabel,
} from "@/modules/users/lib/members-utils";

interface MembersMobileListProps {
  members: MemberUser[];
}

export function MembersMobileList({ members }: MembersMobileListProps) {
  return (
    <div className="card-list lg:hidden">
      {members.map((member) => (
        <Link
          key={member.id}
          href={`/dashboard/members/${member.id}`}
          className="card-list-item cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{member.name}</p>
                <span className={`badge text-[10px] ${member.role === "admin" ? "badge-primary" : "badge-neutral"}`}>
                  {member.role === "admin" ? "Admin" : "TV"}
                </span>
                <span className={`badge text-[10px] ${getApprovalBadgeClass(member.approval_status)}`}>
                  {getApprovalLabel(member.approval_status)}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">@{member.username} • {member.phone}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${member.balance >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                {member.balance.toLocaleString("vi-VN")} đ
              </p>
              <span className={`badge text-[10px] ${member.is_active ? "badge-success" : "badge-neutral"}`}>
                {member.is_active ? "Hoạt động" : "Ngừng"}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
