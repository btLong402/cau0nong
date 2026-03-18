/**
 * Health Check Endpoint
 * 
 * Simple GET endpoint to verify API is running.
 * Demonstrates base API infrastructure without authentication.
 * 
 * GET /api/health
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "status": "ok",
 *     "timestamp": "2025-04-01T12:34:56Z"
 *   },
 *   "traceId": "1234567890-..." 
 * }
 */

import { createGetHandler } from "@/shared/api";

export const GET = createGetHandler({
  handler: async (req, context) => {
    return {
      status: "ok",
      timestamp: context.timestamp.toISOString(),
      environment: process.env.NODE_ENV || "development",
    };
  },
});
