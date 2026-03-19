"use client";

import { useEffect, useState } from "react";

import {
  MyAccountDashboardData,
  MyAccountFormValues,
  UserProfile,
} from "@modules/users/types";
import { getErrorMessage } from "@modules/users/lib/my-account-formatters";
import {
  fetchMyAccountDashboard,
  removeMyAvatar,
  updateMyProfile,
  uploadMyAvatar,
} from "@modules/users/lib/my-account.api";
import {
  validateAvatarFile,
  validateProfileName,
} from "@modules/users/lib/my-account-validation";

interface UseMyAccountDashboardResult {
  data: MyAccountDashboardData | null;
  loading: boolean;
  error: string | null;
  isEditing: boolean;
  isSaving: boolean;
  formError: string | null;
  formSuccess: string | null;
  formValues: MyAccountFormValues;
  avatarPreviewUrl: string | null;
  avatarInputKey: number;
  beginEdit: () => void;
  cancelEdit: () => void;
  updateField: (field: keyof MyAccountFormValues, value: string) => void;
  handleAvatarFileChange: (file: File | null) => void;
  saveProfile: () => Promise<void>;
  removeAvatar: () => Promise<void>;
}

function applyProfileToForm(profile: UserProfile | null): MyAccountFormValues {
  if (!profile) {
    return { name: "", phone: "" };
  }

  return {
    name: profile.name || "",
    phone: profile.phone || "",
  };
}

export function useMyAccountDashboard(): UseMyAccountDashboardResult {
  const [data, setData] = useState<MyAccountDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<MyAccountFormValues>({
    name: "",
    phone: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);
  const [avatarInputKey, setAvatarInputKey] = useState(0);

  const clearAvatarObjectUrl = () => {
    setAvatarObjectUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  const resetAvatarInput = () => {
    setAvatarFile(null);
    setAvatarInputKey((prev) => prev + 1);
  };

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const dashboardData = await fetchMyAccountDashboard();
        setData(dashboardData);
      } catch (fetchError: unknown) {
        setError(getErrorMessage(fetchError, "Error loading dashboard"));
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  useEffect(() => {
    const profile = data?.profile ?? null;
    setFormValues(applyProfileToForm(profile));
    setAvatarPreviewUrl(profile?.avatar_url || null);
    resetAvatarInput();
    clearAvatarObjectUrl();
  }, [data?.profile]);

  useEffect(() => {
    return () => {
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
      }
    };
  }, [avatarObjectUrl]);

  const beginEdit = () => {
    setFormError(null);
    setFormSuccess(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    const profile = data?.profile ?? null;
    setFormValues(applyProfileToForm(profile));
    setAvatarPreviewUrl(profile?.avatar_url || null);

    resetAvatarInput();
    clearAvatarObjectUrl();
    setFormError(null);
    setFormSuccess(null);
    setIsEditing(false);
  };

  const updateField = (field: keyof MyAccountFormValues, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarFileChange = (file: File | null) => {
    if (!file) {
      return;
    }

    const avatarError = validateAvatarFile(file);
    if (avatarError) {
      setFormError(avatarError);
      setFormSuccess(null);
      return;
    }

    setFormError(null);
    setAvatarFile(file);

    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarObjectUrl(objectUrl);
    setAvatarPreviewUrl(objectUrl);
  };

  const saveProfile = async () => {
    if (!data?.profile || isSaving) {
      return;
    }

    const trimmedName = formValues.name.trim();
    const trimmedPhone = formValues.phone.trim();

    const profileNameError = validateProfileName(trimmedName);
    if (profileNameError) {
      setFormError(profileNameError);
      setFormSuccess(null);
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      let latestAvatarUrl = data.profile.avatar_url || null;

      if (avatarFile) {
        latestAvatarUrl = await uploadMyAvatar(avatarFile);
      }

      const updatedUser = await updateMyProfile({
        name: trimmedName,
        phone: trimmedPhone,
      });

      setData((prev) => {
        if (!prev || !prev.profile) {
          return prev;
        }

        return {
          ...prev,
          profile: {
            ...prev.profile,
            name: updatedUser.name,
            phone: updatedUser.phone,
            email: updatedUser.email || prev.profile.email,
            avatar_url: latestAvatarUrl,
          },
        };
      });

      window.dispatchEvent(new Event("auth:user-updated"));

      resetAvatarInput();
      clearAvatarObjectUrl();
      setFormSuccess("Đã cập nhật thông tin cá nhân thành công.");
      setIsEditing(false);
    } catch (saveError: unknown) {
      setFormError(getErrorMessage(saveError, "Đã có lỗi xảy ra khi cập nhật."));
    } finally {
      setIsSaving(false);
    }
  };

  const removeAvatar = async () => {
    if (!data?.profile || isSaving) {
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await removeMyAvatar();

      setData((prev) => {
        if (!prev || !prev.profile) {
          return prev;
        }

        return {
          ...prev,
          profile: {
            ...prev.profile,
            avatar_url: null,
          },
        };
      });

      setAvatarPreviewUrl(null);
      resetAvatarInput();
      clearAvatarObjectUrl();

      window.dispatchEvent(new Event("auth:user-updated"));
      setFormSuccess("Đã xóa avatar thành công.");
    } catch (removeError: unknown) {
      setFormError(getErrorMessage(removeError, "Đã có lỗi xảy ra khi xóa avatar."));
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
  };
}
