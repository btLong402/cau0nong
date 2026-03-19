export function validateAvatarFile(file: File): string | null {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowedTypes.includes(file.type)) {
    return "Ảnh không hợp lệ. Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.";
  }

  if (file.size > maxSize) {
    return "Ảnh quá lớn. Dung lượng tối đa là 5MB.";
  }

  return null;
}

export function validateProfileName(name: string): string | null {
  if (name.trim().length < 2) {
    return "Họ tên phải có ít nhất 2 ký tự.";
  }

  return null;
}
