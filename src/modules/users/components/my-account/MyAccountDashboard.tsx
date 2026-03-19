"use client";

import { useMyAccountDashboard } from "@modules/users/hooks/useMyAccountDashboard";

import { MyAccountCurrentMonthSummary } from "./MyAccountCurrentMonthSummary";
import { MyAccountErrorState } from "./MyAccountErrorState";
import { MyAccountLoadingState } from "./MyAccountLoadingState";
import { MyAccountPaymentHistory } from "./MyAccountPaymentHistory";
import { MyAccountProfileCard } from "./MyAccountProfileCard";
import { MyAccountSettlementBreakdown } from "./MyAccountSettlementBreakdown";

export function MyAccountDashboard() {
  const {
    data,
    loading,
    error,
    isEditing,
    isSaving,
    formError,
    formSuccess,
    formValues,
    avatarPreviewUrl,
    avatarInputKey,
    beginEdit,
    cancelEdit,
    updateField,
    handleAvatarFileChange,
    saveProfile,
    removeAvatar,
  } = useMyAccountDashboard();

  if (loading) {
    return <MyAccountLoadingState />;
  }

  if (error || !data) {
    return <MyAccountErrorState error={error} />;
  }

  const { profile, current_month, current_settlement, payment_history } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Trang cá nhân</h1>
        <p className="page-subtitle">Thông tin tài khoản và công nợ của bạn</p>
      </div>

      {profile && (
        <MyAccountProfileCard
          profile={profile}
          isEditing={isEditing}
          isSaving={isSaving}
          formError={formError}
          formSuccess={formSuccess}
          formValues={formValues}
          avatarPreviewUrl={avatarPreviewUrl}
          avatarInputKey={avatarInputKey}
          onStartEdit={beginEdit}
          onCancelEdit={cancelEdit}
          onSave={saveProfile}
          onRemoveAvatar={removeAvatar}
          onAvatarFileChange={handleAvatarFileChange}
          onFieldChange={updateField}
        />
      )}

      {current_month && (
        <MyAccountCurrentMonthSummary
          month={current_month}
          settlement={current_settlement}
        />
      )}

      {current_settlement && (
        <MyAccountSettlementBreakdown settlement={current_settlement} />
      )}

      <MyAccountPaymentHistory paymentHistory={payment_history} />

      {!current_month && (
        <div className="surface-card empty-state border-dashed">
          <p className="empty-state-title">Chưa có kỳ quản lý nào được tạo.</p>
        </div>
      )}
    </div>
  );
}
