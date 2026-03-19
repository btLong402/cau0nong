import { ApprovalStatus } from "@/modules/users/types";

export function getApprovalBadgeClass(status: ApprovalStatus): string {
  if (status === "approved") {
    return "badge-success";
  }

  if (status === "rejected") {
    return "badge-neutral";
  }

  return "badge-warning";
}

export function getApprovalLabel(status: ApprovalStatus): string {
  if (status === "approved") {
    return "Đã duyệt";
  }

  if (status === "rejected") {
    return "Từ chối";
  }

  return "Chờ duyệt";
}
