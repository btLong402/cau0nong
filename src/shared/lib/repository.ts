/**
 * Generic Repository Pattern for Data Access
 * Provides base class for all data access implementations
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  ApiError,
  ConflictError,
  NotFoundError,
  ServerError,
  InvalidStateError,
} from "../api/base-errors";
import { QueryFilter } from "../api/types";

/**
 * Generic Repository Base Class
 *
 * @example
 * class UserRepository extends Repository<User> {
 *   constructor(supabaseClient: SupabaseClient) {
 *     super(supabaseClient, 'users');
 *   }
 * }
 */
export class Repository<T extends Record<string, any>> {
  protected supabase: SupabaseClient;
  protected tableName: string;
  protected primaryKey: string = "id";

  constructor(
    supabaseClient: SupabaseClient,
    tableName: string,
    primaryKey: string = "id"
  ) {
    this.supabase = supabaseClient;
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  /**
   * Find multiple records matching filters
   */
  async find(filters: QueryFilter = {}, limit?: number, offset?: number) {
    try {
      let query = this.supabase.from(this.tableName).select("*");

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          query = query.is(key, null);
        } else if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as T[];
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Find single record by primary key
   */
  async findById(id: string | number) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq(this.primaryKey, id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new NotFoundError(this.tableName);
      }

      return data as T;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Find single record matching filters
   */
  async findOne(filters: QueryFilter) {
    try {
      let query = this.supabase.from(this.tableName).select("*");

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          query = query.is(key, null);
        } else {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new NotFoundError(this.tableName);
      }

      return data as T;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>) {
    try {
      const { data: created, error } = await this.supabase
        .from(this.tableName)
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return created as T;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Create multiple records
   */
  async createMany(records: Partial<T>[]) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(records)
        .select();

      if (error) {
        throw error;
      }

      return data as T[];
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Update record by ID
   */
  async update(id: string | number, data: Partial<T>) {
    try {
      const { data: updated, error } = await this.supabase
        .from(this.tableName)
        .update(data)
        .eq(this.primaryKey, id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!updated) {
        throw new NotFoundError(this.tableName);
      }

      return updated as T;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Delete record by ID
   */
  async delete(id: string | number) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq(this.primaryKey, id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Check if record exists matching filters
   */
  async exists(filters: QueryFilter): Promise<boolean> {
    try {
      const records = await this.find(filters, 1);
      return records.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Count records matching filters
   */
  async count(filters: QueryFilter = {}): Promise<number> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select("*", { count: "exact", head: true });

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          query = query.is(key, null);
        } else {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * Map Supabase errors to domain errors
   * Override in subclass for custom error mapping
   */
  protected mapError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    // Supabase error
    if (error.code) {
      switch (error.code) {
        case "23505": // Unique constraint violation
        case "PGRST116": // Unique constraint violation
          return new ConflictError(
            "Record already exists",
            { code: error.code }
          );

        case "23503": // Foreign key constraint violation
          return new InvalidStateError(
            "Invalid reference: related record not found",
            { code: error.code }
          );

        case "42P01": // Table not found
          return new ServerError("Database table not found");

        default:
          return new ServerError(
            `Database error: ${error.message || "Lỗi không xác định"}`
          );
      }
    }

    // General error
    return new ServerError(error.message || "Unknown database error");
  }
}
