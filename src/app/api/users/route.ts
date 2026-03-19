import { createGetHandler, createPostHandler } from '@/shared/api';
import { createUsersService } from '@/modules/users/users.service';
import { ValidationError } from '@/shared/api/base-errors';

export const GET = createGetHandler({
  requireAuth: true,
  requireRole: ['admin'],
  handler: async (req) => {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (page < 1 || limit < 1) {
      throw new ValidationError('Tham số phân trang không hợp lệ');
    }

    const usersService = await createUsersService();
    const result = await usersService.listMembers(page, limit);

    return result;
  },
});

export const POST = createPostHandler({
  requireAuth: true,
  requireRole: ['admin'],
  handler: async (req) => {
    const { username, email, phone, name, password, role } = await req.json();

    if (!email || !phone || !name || !username) {
      throw new ValidationError('Thiếu các trường bắt buộc: username, email, phone, name');
    }

    if (!/^[a-zA-Z0-9_]{4,30}$/.test(username)) {
      throw new ValidationError('Username phải dài 4-30 ký tự và chỉ gồm chữ cái, số, dấu gạch dưới');
    }

    const usersService = await createUsersService();
    const user = await usersService.createMember({
      username: username.toLowerCase(),
      email,
      phone,
      name,
      password,
      role: role || 'member'
    });

    return { user };
  },
});
