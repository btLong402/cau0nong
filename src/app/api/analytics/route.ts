/**
 * Analytics API
 * GET /api/analytics?type=overview|attendance|expense
 */

import { createGetHandler } from "@/shared/api";
import { createAnalyticsService } from "@/modules/analytics/analytics.service";
import { ValidationError } from "@/shared/api/base-errors";
import type { AnalyticsType } from "@/modules/analytics/types";

export const GET = createGetHandler({
  requireAuth: true,
  handler: async (req) => {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") as AnalyticsType;

    if (!type) {
      throw new ValidationError("Thiếu tham số truy vấn type");
    }

    const service = await createAnalyticsService();
    const data = await service.getAnalytics(type);

    return { type, data };
  },
});
