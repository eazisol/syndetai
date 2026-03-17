// src/lib/approvalProvisioning.js
// All helper functions for the submission approval provisioning flow.
// Called by /api/approve-submission when status = "approved"
//
// Flow order:
//  1. findCompanyByUrl        → companies table  (optional match)
//  2. getDefaultReportTypeId  → report_types table
//  3. createOrganisation      → organisations table
//  4. createPerson            → people table
//  5. createOrFindAuthUser    → Supabase Auth (admin.createUser)
//  6. createAppUser           → users table
//  7. createReport            → reports table   (if company + reportType found)
//  8. insertEventLog          → event_log table

import { v4 as uuidv4 } from "uuid";

const SCHEMA = "syndet";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Find company by target URL
// ─────────────────────────────────────────────────────────────────────────────
export async function findCompanyByUrl(supabaseAdmin, rawUrl) {
  if (!rawUrl) return null;

  // Strip protocol + www so "https://www.acme.com/" → "acme.com"
  const urlToMatch = rawUrl
    .replace(/^(https?:\/\/)?(www\.)?/i, "")
    .replace(/\/$/, "")
    .trim();

  if (!urlToMatch) return null;

  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("companies")
    .select("id, name")
    .ilike("website", `%${urlToMatch}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("findCompanyByUrl error (non-fatal):", error.message);
    return null;
  }

  return data || null; // { id, name } or null
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get "Default Investor Report" type id from report_types
// ─────────────────────────────────────────────────────────────────────────────
export async function getDefaultReportTypeId(supabaseAdmin) {
  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("report_types")
    .select("id")
    .eq("name", "Default Investor Report")
    .maybeSingle();

  if (error) {
    console.warn("getDefaultReportTypeId error (non-fatal):", error.message);
    return null;
  }

  return data?.id || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Create organisation
// ─────────────────────────────────────────────────────────────────────────────
export async function createOrganisation(supabaseAdmin, submission, submissionId) {
  // Use fund/company name if given, else fall back to submitter's name
  const orgName =
    submission.company_fund_name ||
    submission.target_company_name ||
    `${submission.full_name || "User"}'s Organisation`;

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("organisations")
    .insert([
      {
        id: uuidv4(),
        name: orgName,
        account_type: "investor",
        lifecycle_status: "active",
        is_active: true,
        source: submission.source || "Landing Page",
        credit_balance: 0,
        metadata: {
          submission_id: submissionId,
          submitted_by: submission.email,
        },
        created_at: now,
        updated_at: now,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`createOrganisation failed: ${error.message}`);
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Create person (linked to organisation)
// ─────────────────────────────────────────────────────────────────────────────
export async function createPerson(supabaseAdmin, organisationId, submission) {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("people")
    .insert([
      {
        id: uuidv4(),
        organisation_id: organisationId,
        full_name: submission.full_name || null,
        email: submission.email || null,
        is_employee: true,
        is_founder: false,
        is_board: false,
        created_at: now,
        updated_at: now,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`createPerson failed: ${error.message}`);
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Create (or find existing) Supabase Auth user
//    Returns the Supabase Auth UUID
// ─────────────────────────────────────────────────────────────────────────────
export async function createOrFindAuthUser(supabaseAdmin, submission) {
  // Try to create the auth user first
  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: submission.email,
      email_confirm: true,
      user_metadata: {
        full_name: submission.full_name,
      },
      // Random temp password — user will reset via email link
      password: uuidv4().replace(/-/g, "").slice(0, 12) + "A1!",
    });

  if (!createError) {
    return created?.user?.id || null;
  }

  // If user already exists, look them up
  const msg = createError.message?.toLowerCase() || "";
  if (!msg.includes("already")) {
    throw new Error(`createOrFindAuthUser failed: ${createError.message}`);
  }

  console.warn("Auth user already exists, looking up by email:", submission.email);

  const { data: listed, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    throw new Error(`listUsers failed: ${listError.message}`);
  }

  const existing = listed?.users?.find(
    (u) => u.email?.toLowerCase() === submission.email?.toLowerCase()
  );

  return existing?.id || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Create app user (users table)
//    id = new UUID; auth_user_id = Supabase Auth UUID
// ─────────────────────────────────────────────────────────────────────────────
export async function createAppUser(
  supabaseAdmin,
  personId,
  organisationId,
  authUserId,
  submission
) {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("users")
    .insert([
      {
        id: uuidv4(),
        person_id: personId,
        organisation_id: organisationId,
        auth_user_id: authUserId,
        email: submission.email,
        username: submission.email?.split("@")?.[0] || `user_${Date.now()}`,
        is_admin: true,
        is_superadmin: false,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`createAppUser failed: ${error.message}`);
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Create one free report
//    Only runs if both companyId and reportTypeId are resolved
// ─────────────────────────────────────────────────────────────────────────────
export async function createReport(
  supabaseAdmin,
  organisationId,
  companyId,
  reportTypeId,
  appUserId,
  submission
) {
  if (!companyId || !reportTypeId) {
    console.warn("createReport skipped: missing companyId or reportTypeId");
    return null;
  }

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("reports")
    .insert([
      {
        id: uuidv4(),
        company_id: companyId,
        organisation_id: organisationId,
        report_type_id: reportTypeId,
        persona_variant: "investor",
        version: 1,
        // status intentionally omitted — let DB column default apply
        //   (reports_status_check rejects arbitrary values like "pending")
        visibility: "private",
        source: "auto-provision",
        title: `Investor Report – ${submission.target_company_name || "Requested Company"}`,
        storage_path: null,
        generated_at: null,
        reviewed_by: appUserId,
        reviewed_at: null,
        created_at: now,
        updated_at: now,
      },
    ])
    .select()
    .single();

  if (error) {
    // Non-fatal: report creation failing shouldn't block the full approval
    console.log("createReport failed (non-fatal):", error.message);
    return null;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Insert event log entry
// ─────────────────────────────────────────────────────────────────────────────
export async function insertEventLog(
  supabaseAdmin,
  organisationId,
  appUserId,
  submissionId
) {
  const { error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("event_log")
    .insert([
      {
        event_type: "submission_approved",
        organisation_id: organisationId,
        user_id: appUserId,
        metadata: {
          submission_id: submissionId,
          provisioned_at: new Date().toISOString(),
        },
      },
    ]);

  if (error) {
    // Non-fatal: don't block approval for a logging failure
    console.log("insertEventLog failed (non-fatal):", error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ORCHESTRATOR
// Call this when status = "approved" and it's a fresh (not yet provisioned) submission
// ─────────────────────────────────────────────────────────────────────────────
export async function runApprovalProvisioningFlow(
  supabaseAdmin,
  submission,
  submissionId
) {
  console.log("── Starting provisioning for submission:", submissionId);

  // Step 1: Lookup company (non-blocking)
  const company = await findCompanyByUrl(supabaseAdmin, submission.target_company_url);
  const companyId = company?.id || null;
  console.log("Company match:", company ? `${company.name} (${companyId})` : "none");

  // Step 2: Get report type id (non-blocking)
  const reportTypeId = await getDefaultReportTypeId(supabaseAdmin);
  console.log("Report type id:", reportTypeId ?? "not found");

  // Step 3: Create organisation
  const organisation = await createOrganisation(supabaseAdmin, submission, submissionId);
  console.log("Organisation created:", organisation.id);

  // Step 4: Create person
  const person = await createPerson(supabaseAdmin, organisation.id, submission);
  console.log("Person created:", person.id);

  // Step 5: Create / find auth user
  const authUserId = await createOrFindAuthUser(supabaseAdmin, submission);
  console.log("Auth user id:", authUserId ?? "null");

  // Step 6: Create app user
  const appUser = await createAppUser(
    supabaseAdmin,
    person.id,
    organisation.id,
    authUserId,
    submission
  );
  console.log("App user created:", appUser.id);

  // Step 7: Create free report (non-fatal if it fails)
  const report = await createReport(
    supabaseAdmin,
    organisation.id,
    companyId,
    reportTypeId,
    appUser.id,
    submission
  );
  console.log("Report created:", report?.id ?? "skipped");

  // Step 8: Event log (non-fatal)
  await insertEventLog(supabaseAdmin, organisation.id, appUser.id, submissionId);
  console.log("Event log inserted");

  return {
    organisationId: organisation.id,
    personId: person.id,
    authUserId,
    appUserId: appUser.id,
    reportId: report?.id || null,
    companyMatched: !!companyId,
    reportTypeFound: !!reportTypeId,
  };
}
