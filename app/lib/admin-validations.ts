import { z } from "zod";

// Admin creation validation
export const createAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

// Bulk operation validation
export const bulkOperationSchema = z.object({
  userIds: z
    .array(z.string().uuid("Invalid user ID format"))
    .min(1, "At least one user ID is required")
    .max(100, "Cannot process more than 100 users at once"),
  approvalTypes: z
    .object({
      talent: z.boolean().optional(),
      mentor: z.boolean().optional(),
      recruiter: z.boolean().optional(),
    })
    .optional(),
  rejectionReason: z.string().min(10, "Rejection reason must be at least 10 characters").max(500).optional(),
});

export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;

// Single user approval validation
export const approveUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  approvalTypes: z
    .object({
      talent: z.boolean().optional(),
      mentor: z.boolean().optional(),
      recruiter: z.boolean().optional(),
    })
    .refine(
      (data) => data.talent || data.mentor || data.recruiter,
      "At least one approval type must be selected"
    ),
});

export type ApproveUserInput = z.infer<typeof approveUserSchema>;

// Rejection validation
export const rejectUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  rejectionReason: z.string().min(10, "Rejection reason must be at least 10 characters").max(500),
});

export type RejectUserInput = z.infer<typeof rejectUserSchema>;

// Company update validation
export const updateCompanySchema = z.object({
  designation: z.string().min(2).max(200).optional(),
  headline: z.string().min(10).max(500).optional(),
  email: z.string().email().optional(),
  phone_country_code: z.string().regex(/^\d{1,4}$/).optional(),
  phone_number: z.string().regex(/^\d{6,15}$/).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().length(2, "Country code must be 2 characters").optional(),
  linkedin: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  telegram: z.string().max(100).optional(),
  approved: z.boolean().optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      };
    }
    return {
      success: false,
      errors: ["Validation failed"],
    };
  }
}
