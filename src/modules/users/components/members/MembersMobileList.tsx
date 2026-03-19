import Link from "next/link";
import { UserAvatar } from "@/app/dashboard/_components/UserAvatar";

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
      {members.map((member) => {
        const displayName = member.name?.trim() || "Chưa cập nhật";
        const displayUsername = member.username?.trim() || "--";
        const displayPhone = member.phone?.trim() || "--";
        const displayBalance = typeof member.balance === "number" ? member.balance : 0;

        return (
          <Link
            key={member.id}
            href={`/dashboard/members/${member.id}`}
            className="card-list-item cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <UserAvatar
                name={displayName}
                avatarUrl={member.avatar_url}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</p>
                  <span className={`badge text-[10px] ${member.role === "admin" ? "badge-primary" : "badge-neutral"}`}>
                    {member.role === "admin" ? "Admin" : "TV"}
                  </span>
                  <span className={`badge text-[10px] ${getApprovalBadgeClass(member.approval_status)}`}>
                    {getApprovalLabel(member.approval_status)}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">@{displayUsername} • {displayPhone}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${displayBalance >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                  {displayBalance.toLocaleString("vi-VN")} đ
                </p>
                <span className={`badge text-[10px] ${member.is_active ? "badge-success" : "badge-neutral"}`}>
                  {member.is_active ? "Hoạt động" : "Ngừng"}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
