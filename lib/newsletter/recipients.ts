import sql from "@/lib/db";
import { buildTextSearchFilter, buildWhereClause } from "@/lib/admin-filters";

export type NewsletterSegment = "all" | "talent" | "company" | "both" | "code_of_hive";

export interface RecipientsFilter {
  segment?: NewsletterSegment;
  approvedOnly?: boolean;
  search?: string;
}

export interface RecipientRow {
  user_id: string;
  email: string | null;
  name: string;
  is_talent: boolean;
  is_company: boolean;
  talent_approved: boolean;
  company_approved: boolean;
  code_of_hive_signed: boolean;
  created_at: string;
}

const BASE_FROM = `
  FROM goodhive.users u
  LEFT JOIN goodhive.talents t ON t.user_id = u.userid
  LEFT JOIN goodhive.companies c ON c.user_id = u.userid
`;

const RECIPIENT_SELECT = `
  u.userid AS user_id,
  COALESCE(u.email, t.email, c.email) AS email,
  COALESCE(
    NULLIF(TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, ''))), ''),
    NULLIF(c.designation, ''),
    NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
    COALESCE(u.email, t.email, c.email)
  ) AS name,
  (t.user_id IS NOT NULL) AS is_talent,
  (c.user_id IS NOT NULL) AS is_company,
  COALESCE(t.approved, false) AS talent_approved,
  COALESCE(c.approved, false) AS company_approved,
  COALESCE(t.code_of_hive_signed, false) AS code_of_hive_signed,
  u.created_at AS created_at
`;

function buildRecipientsFilters(filter: RecipientsFilter) {
  const filters: Array<{ condition: string; values: any[] }> = [
    { condition: "(t.user_id IS NOT NULL OR c.user_id IS NOT NULL)", values: [] },
    { condition: "(u.is_deleted IS NULL OR u.is_deleted = $)", values: [false] },
    { condition: "(u.newsletter_opt_out IS NULL OR u.newsletter_opt_out = $)", values: [false] },
  ];

  const segment = filter.segment ?? "all";
  if (segment === "talent") {
    filters.push({ condition: "(t.user_id IS NOT NULL AND c.user_id IS NULL)", values: [] });
  } else if (segment === "company") {
    filters.push({ condition: "(c.user_id IS NOT NULL AND t.user_id IS NULL)", values: [] });
  } else if (segment === "both") {
    filters.push({ condition: "(t.user_id IS NOT NULL AND c.user_id IS NOT NULL)", values: [] });
  } else if (segment === "code_of_hive") {
    filters.push({ condition: "t.code_of_hive_signed = $", values: [true] });
  }

  if (filter.approvedOnly) {
    filters.push({
      condition: "(COALESCE(t.approved, false) = $ OR COALESCE(c.approved, false) = $)",
      values: [true, true],
    });
  }

  const searchFilter = buildTextSearchFilter(filter.search, [
    "COALESCE(t.first_name, '')",
    "COALESCE(t.last_name, '')",
    "COALESCE(c.designation, '')",
    "COALESCE(u.first_name, '')",
    "COALESCE(u.last_name, '')",
    "COALESCE(u.email, '')",
    "COALESCE(t.email, '')",
    "COALESCE(c.email, '')",
  ]);
  if (searchFilter.condition) filters.push(searchFilter);

  return filters;
}

export async function queryRecipients(
  filter: RecipientsFilter,
  limit: number,
  offset: number,
): Promise<{ rows: RecipientRow[]; total: number }> {
  const filters = buildRecipientsFilters(filter);
  const { whereClause, values } = buildWhereClause(filters);

  const countQuery = `SELECT COUNT(*) AS total ${BASE_FROM} ${whereClause}`;
  const countResult = await sql.unsafe<{ total: string }[]>(countQuery, values);
  const total = parseInt(countResult[0]?.total ?? "0", 10);

  const query = `
    SELECT ${RECIPIENT_SELECT}
    ${BASE_FROM}
    ${whereClause}
    ORDER BY u.created_at DESC, u.userid ASC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;
  const rows = await sql.unsafe<RecipientRow[]>(query, [...values, limit, offset]);

  return { rows, total };
}

/** Resolves every recipient matching a saved filter — no pagination, used at send time. */
export async function resolveRecipientsByFilter(
  filter: RecipientsFilter,
): Promise<RecipientRow[]> {
  const filters = buildRecipientsFilters(filter);
  const { whereClause, values } = buildWhereClause(filters);

  const query = `SELECT ${RECIPIENT_SELECT} ${BASE_FROM} ${whereClause}`;
  return sql.unsafe<RecipientRow[]>(query, values);
}

/** Resolves a specific list of user ids, still respecting opt-out + deletion. */
export async function resolveRecipientsByIds(userIds: string[]): Promise<RecipientRow[]> {
  if (userIds.length === 0) return [];

  const query = `
    SELECT ${RECIPIENT_SELECT}
    ${BASE_FROM}
    WHERE u.userid = ANY($1)
      AND (t.user_id IS NOT NULL OR c.user_id IS NOT NULL)
      AND (u.is_deleted IS NULL OR u.is_deleted = false)
      AND (u.newsletter_opt_out IS NULL OR u.newsletter_opt_out = false)
  `;
  return sql.unsafe<RecipientRow[]>(query, [userIds]);
}
