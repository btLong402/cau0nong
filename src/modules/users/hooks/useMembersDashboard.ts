"use client";

import { FormEvent, useState } from "react";

import { useAuth, useMembers } from "@/shared/hooks";
import { apiRequest } from "@/shared/lib";
import { CreateMemberFormData, MemberUser } from "@/modules/users/types";

const DEFAULT_FORM_DATA: CreateMemberFormData = {
  username: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "member",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useMembersDashboard() {
  const { user: authUser } = useAuth();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalProcessingId, setApprovalProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateMemberFormData>(DEFAULT_FORM_DATA);

  const { members, total, loading, refetch } = useMembers(page, 20, {
    enabled: authUser?.role === "admin",
  });

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const updateFormField = (field: keyof CreateMemberFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openCreateMemberModal = () => {
    setError(null);
    setIsModalOpen(true);
  };

  const closeCreateMemberModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
    setError(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const createMember = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiRequest<{ user: MemberUser }>("/api/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      closeCreateMemberModal();
      await refetch();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Không thể tạo thành viên."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalAction = async (memberId: string, action: "approve" | "reject") => {
    setApprovalProcessingId(memberId);
    setError(null);

    try {
      await apiRequest<{ user: MemberUser }>(`/api/users/${memberId}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });

      await refetch();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Không thể xử lý duyệt tài khoản."));
    } finally {
      setApprovalProcessingId(null);
    }
  };

  const goToPrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  return {
    authUser,
    members,
    total,
    loading,
    refetch,
    page,
    totalPages,
    isModalOpen,
    isSubmitting,
    approvalProcessingId,
    error,
    formData,
    setPage,
    updateFormField,
    openCreateMemberModal,
    closeCreateMemberModal,
    createMember,
    handleApprovalAction,
    goToPrevPage,
    goToNextPage,
  };
}
