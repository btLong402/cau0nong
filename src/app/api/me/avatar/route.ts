import {
  createDeleteHandler,
  createPostHandler,
  type RequestContext,
  ServerError,
  ValidationError,
} from "@/shared/api";
import { createUsersService } from "@/modules/users/users.service";
import { createAdminClient } from "@/lib/supabase";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

function buildAvatarPublicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
      throw new ServerError("Supabase URL chưa được cấu hình");
  }

  return `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}

function extractAvatarPath(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;

  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const markerIndex = avatarUrl.indexOf(marker);

  if (markerIndex < 0) return null;

  return avatarUrl.slice(markerIndex + marker.length);
}

function getFileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;

  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

async function ensureAvatarBucket() {
  const adminClient = createAdminClient();

  const { error: getBucketError } = await adminClient.storage.getBucket(AVATAR_BUCKET);

  if (!getBucketError) return;

  const isNotFound = getBucketError.message.toLowerCase().includes("not found");
  if (!isNotFound) {
    throw new ServerError("Không thể kiểm tra bucket lưu trữ avatar");
  }

  const { error: createBucketError } = await adminClient.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_AVATAR_FILE_SIZE}`,
    allowedMimeTypes: [...ALLOWED_AVATAR_TYPES],
  });

  if (createBucketError) {
    throw new ServerError("Không thể tạo bucket lưu trữ avatar");
  }
}

async function deleteAvatarPath(path: string): Promise<void> {
  const adminClient = createAdminClient();
  const { error } = await adminClient.storage.from(AVATAR_BUCKET).remove([path]);

  if (error) {
    const message = error.message.toLowerCase();
    const isNotFound = message.includes("not found") || message.includes("does not exist");
    if (!isNotFound) {
      throw new ServerError("Không thể xóa avatar cũ");
    }
  }
}

export const POST = createPostHandler({
  requireAuth: true,
  handler: async (req, context) => {
    const authContext = context as RequestContext;
    const userId = authContext.auth.userId;

    const usersService = await createUsersService();
    const currentUser = await usersService.getMember(userId);

    const formData = await req.formData();
    const filePart = formData.get("avatar");

    if (!(filePart instanceof File)) {
      throw new ValidationError("Thiếu tệp avatar");
    }

    if (!ALLOWED_AVATAR_TYPES.includes(filePart.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
      throw new ValidationError("Loại tệp avatar không hợp lệ. Hỗ trợ: jpg, png, webp, gif");
    }

    if (filePart.size > MAX_AVATAR_FILE_SIZE) {
      throw new ValidationError("Tệp avatar quá lớn. Kích thước tối đa là 5MB");
    }

    await ensureAvatarBucket();

    const extension = getFileExtension(filePart);
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

    const adminClient = createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, filePart, {
        contentType: filePart.type,
        upsert: false,
      });

    if (uploadError) {
      throw new ServerError("Không thể tải avatar lên");
    }

    const oldAvatarPath = extractAvatarPath(currentUser.avatar_url);
    const nextAvatarUrl = buildAvatarPublicUrl(filePath);

    try {
      if (oldAvatarPath) {
        await deleteAvatarPath(oldAvatarPath);
      }

      const updatedUser = await usersService.updateMember(userId, {
        avatar_url: nextAvatarUrl,
      });

      return {
        user: updatedUser,
        avatar_url: updatedUser.avatar_url || null,
      };
    } catch (error) {
      await deleteAvatarPath(filePath);
      throw error;
    }
  },
});

export const DELETE = createDeleteHandler({
  requireAuth: true,
  handler: async (_, context) => {
    const authContext = context as RequestContext;
    const userId = authContext.auth.userId;

    const usersService = await createUsersService();
    const currentUser = await usersService.getMember(userId);

    const oldAvatarPath = extractAvatarPath(currentUser.avatar_url);
    if (oldAvatarPath) {
      await deleteAvatarPath(oldAvatarPath);
    }

    const updatedUser = await usersService.updateMember(userId, {
      avatar_url: null,
    });

    return {
      user: updatedUser,
      avatar_url: null,
    };
  },
});
