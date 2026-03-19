"use client";

import { AddMemberModal } from "@/modules/users/components/members/AddMemberModal";
import { MembersDesktopTable } from "@/modules/users/components/members/MembersDesktopTable";
import { MembersHeader } from "@/modules/users/components/members/MembersHeader";
import { MembersLoadingState } from "@/modules/users/components/members/MembersLoadingState";
import { MembersMobileList } from "@/modules/users/components/members/MembersMobileList";
import { MembersPagination } from "@/modules/users/components/members/MembersPagination";
import { useMembersDashboard } from "@/modules/users/hooks/useMembersDashboard";

export function MembersDashboard() {
  const {
    authUser,
    members,
    loading,
    refetch,
    page,
    totalPages,
    isModalOpen,
    isSubmitting,
    approvalProcessingId,
    error,
    formData,
    updateFormField,
    openCreateMemberModal,
    closeCreateMemberModal,
    createMember,
    handleApprovalAction,
    goToPrevPage,
    goToNextPage,
  } = useMembersDashboard();

  if (loading && members.length === 0) {
    return <MembersLoadingState />;
  }

  return (
    <div className="space-y-6">
      <MembersHeader
        isAdmin={authUser?.role === "admin"}
        onAddMember={openCreateMemberModal}
      />

      {error && (
        <div className="surface-card p-4 border border-[var(--danger)] bg-[var(--danger-soft)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-[var(--danger)]">{error}</p>
            <button type="button" className="btn-secondary" onClick={refetch}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      <MembersDesktopTable
        members={members}
        isAdmin={authUser?.role === "admin"}
        approvalProcessingId={approvalProcessingId}
        onApprovalAction={handleApprovalAction}
      />

      <MembersMobileList members={members} />

      <AddMemberModal
        isOpen={isModalOpen}
        error={error}
        isSubmitting={isSubmitting}
        formData={formData}
        onClose={closeCreateMemberModal}
        onSubmit={createMember}
        onFieldChange={updateFormField}
      />

      <MembersPagination
        page={page}
        totalPages={totalPages}
        onPrev={goToPrevPage}
        onNext={goToNextPage}
      />
    </div>
  );
}
