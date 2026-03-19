/**
 * Shared Library Layer - Barrel Export
 * 
 * Use this index to import shared utilities and data access patterns.
 */

// ============================================
// Repository Pattern
// ============================================
export { Repository } from "./repository";

// ============================================
// Supabase Error Mapping
// ============================================
export {
  mapSupabaseError,
  handleSupabaseError,
  PG_ERROR_CODES,
  SUPABASE_ERROR_CODES,
} from "./supabase-errors";

// ============================================
// API Client
// ============================================
export { apiRequest, apiFetcher, ApiRequestError } from "./api-client";
