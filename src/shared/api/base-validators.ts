/**
 * Base Validation Layer with Zod
 * Provides reusable schemas and validation helpers for the application
 */

import { z } from "zod";
import { ValidationError } from "./base-errors";
import { ValidationResult } from "./types";

// ============================================
// Common Schemas (Reusable)
// ============================================

/**
 * Phone number validation (Vietnamese format)
 * Accepts: 0123456789, +84123456789, +84 123 456 789
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(\+84|0)[0-9\s]{8,12}$/,
    "Invalid phone number format"
  )
  .transform((val) => val.replace(/\s/g, ""));

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .toLowerCase();

/**
 * Date validation (YYYY-MM-DD format)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !isNaN(Date.parse(val)), "Invalid date");

/**
 * Amount validation (positive number with 2 decimals)
 * Examples: 100, 100.00, 100.5
 */
export const amountSchema = z
  .number()
  .positive("Amount must be greater than 0")
  .refine(
    (val) => /^\d+(\.\d{1,2})?$/.test(val.toFixed(2)),
    "Amount must have at most 2 decimal places"
  );

/**
 * Integer amount (for counts)
 */
export const integerAmountSchema = z
  .number()
  .int("Must be an integer")
  .positive("Must be greater than 0");

/**
 * UUID validation
 */
export const uuidSchema = z
  .string()
  .uuid("Invalid UUID format");

/**
 * Optional text field
 */
export const textSchema = z
  .string()
  .max(500, "Text must be 500 characters or less");

/**
 * Optional notes field
 */
export const notesSchema = z
  .string()
  .max(1000, "Notes must be 1000 characters or less")
  .optional();

// ============================================
// Authentication Schemas
// ============================================

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

// ============================================
// User Schemas
// ============================================

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  phone: phoneSchema,
  email: emailSchema,
  role: z.enum(["admin", "member"]),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;

// ============================================
// Session Schemas
// ============================================

export const createSessionSchema = z.object({
  session_date: dateSchema,
  court_expense_amount: amountSchema,
  payer_user_id: uuidSchema,
  notes: notesSchema,
});

export type CreateSessionRequest = z.infer<typeof createSessionSchema>;

export const updateSessionSchema = createSessionSchema.partial();

export type UpdateSessionRequest = z.infer<typeof updateSessionSchema>;

// ============================================
// Session Attendance Schemas
// ============================================

export const attendanceSchema = z.object({
  user_id: uuidSchema,
  is_attended: z.boolean(),
});

export const bulkAttendanceSchema = z.array(attendanceSchema);

export type AttendanceRequest = z.infer<typeof attendanceSchema>;
export type BulkAttendanceRequest = z.infer<typeof bulkAttendanceSchema>;

// ============================================
// Shuttlecock Expense Schemas
// ============================================

export const createShuttlecockExpenseSchema = z.object({
  purchase_date: dateSchema,
  quantity: integerAmountSchema,
  unit_price: amountSchema,
  buyer_user_id: uuidSchema,
  notes: notesSchema,
});

export type CreateShuttlecockExpenseRequest = z.infer<
  typeof createShuttlecockExpenseSchema
>;

// ============================================
// Month Schemas
// ============================================

export const createMonthSchema = z.object({
  month_year: dateSchema.refine(
    (val) => /^\d{4}-\d{2}-01$/.test(val),
    "month_year must be the 1st of a month"
  ),
  status: z.enum(["open", "closed"]).default("open"),
});

export type CreateMonthRequest = z.infer<typeof createMonthSchema>;

// ============================================
// Settlement Payment Schemas
// ============================================

export const confirmSettlementPaymentSchema = z.object({
  paid_amount: z.number().nonnegative("paid_amount must be >= 0").optional(),
});

export type ConfirmSettlementPaymentRequest = z.infer<
  typeof confirmSettlementPaymentSchema
>;

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validate data against a Zod schema
 * Returns structured validation result
 */
export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const parsed = schema.parse(data);
    return {
      isValid: true,
      data: parsed,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return {
        isValid: false,
        errors,
      };
    }
    return {
      isValid: false,
      errors: { general: ["Validation failed"] },
    };
  }
}

/**
 * Validate and throw ValidationError if invalid
 */
export function validateOrThrow<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  traceId: string
): T {
  const result = validateRequest(data, schema);
  if (!result.isValid) {
    throw new ValidationError(
      "Request validation failed",
      result.errors,
      traceId
    );
  }
  return result.data!;
}

/**
 * Create a request validator middleware helper
 */
export function createRequestValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown, traceId: string): T => {
    return validateOrThrow(data, schema, traceId);
  };
}
