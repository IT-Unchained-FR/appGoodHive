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
// Stored company rows use null or "" for empty fields; treat both as "not
// set" (the route saves an unset field as null either way).
const optionalText = (schema: z.ZodString): z.ZodType<string | undefined, z.ZodTypeDef, unknown> =>
  z.preprocess(
    (value) => (value === null || (typeof value === "string" && value.trim() === "") ? undefined : value),
    schema.optional(),
  );

// Mirrors what the company profile form accepts (it has no length or URL
// rules), so an admin can always save a company as it's stored.
export const updateCompanySchema = z.object({
  designation: optionalText(z.string().min(1).max(200)),
  headline: optionalText(z.string().max(10000)),
  email: optionalText(z.string().email()),
  phone_country_code: optionalText(z.string().regex(/^\+?\d{1,4}$/, "Use digits, optionally starting with +")),
  phone_number: optionalText(z.string().regex(/^\+?[\d\s-]{6,20}$/, "Use 6–20 digits")),
  address: optionalText(z.string().max(500)),
  city: optionalText(z.string().max(100)),
  country: optionalText(z.string().max(100)),
  linkedin: optionalText(z.string().max(500)),
  twitter: optionalText(z.string().max(500)),
  github: optionalText(z.string().max(500)),
  telegram: optionalText(z.string().max(255)),
  approved: z.boolean().optional(),
  published: z.boolean().optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

const optionalNumericField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : value;
  }

  return value;
}, z.number().nonnegative().optional());

// Talent update validation
export const updateTalentSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(12000).optional(),
  country: z.string().length(2, "Country code must be 2 characters").optional().or(z.literal("")),
  city: z.string().max(100).optional(),
  phone_country_code: z
    .string()
    .regex(/^\+?[0-9,\-\s]{1,24}$/, "Invalid phone country code")
    .optional()
    .or(z.literal("")),
  phone_number: z
    .string()
    .regex(/^[0-9()\-\s]{6,20}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  about_work: z.string().max(12000).optional(),
  min_rate: optionalNumericField,
  max_rate: optionalNumericField,
  freelance_only: z.boolean().optional(),
  remote_only: z.boolean().optional(),
  skills: z.string().max(4000).optional(),
  linkedin: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  stackoverflow: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  telegram: z.string().max(100).optional(),
  approved: z.boolean().optional(),
  talent: z.boolean().optional(),
  mentor: z.boolean().optional(),
  recruiter: z.boolean().optional(),
});

export type UpdateTalentInput = z.infer<typeof updateTalentSchema>;

// Newsletter campaign validation
export const newsletterAudienceSchema = z
  .object({
    mode: z.enum(["ids", "filter"]),
    segment: z.enum(["all", "talent", "company", "both", "code_of_hive"]).optional(),
    approvedOnly: z.boolean().optional(),
    search: z.string().max(200).optional(),
    userIds: z.array(z.string().uuid()).max(20000).optional(),
    excludedIds: z.array(z.string().uuid()).max(20000).optional(),
  })
  .refine(
    (data) => data.mode !== "ids" || (data.userIds && data.userIds.length > 0),
    "userIds is required when mode is \"ids\"",
  );

export const newsletterCampaignSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  bodyHtml: z.string().min(1, "Newsletter body cannot be empty").max(50000),
  audience: newsletterAudienceSchema,
});

export type NewsletterCampaignInput = z.infer<typeof newsletterCampaignSchema>;

// Validation helper function
export function validateInput<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
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
