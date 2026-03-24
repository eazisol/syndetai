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
//  9. updateSubmissionWithOrg → new_submissions table (links submission to org)

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
// 1b. Create company
// ─────────────────────────────────────────────────────────────────────────────
export async function createCompany(supabaseAdmin, name, url) {
  const now = new Date().toISOString();
  const id = uuidv4();

  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("companies")
    .insert([
      {
        id,
        name: name || "Unknown Company",
        website: url || null,
        source: "auto-provision",
        created_at: now,
        updated_at: now,
      },
    ])
    .select("id, name")
    .single();

  if (error) {
    console.log("createCompany failed:", error.message);
    return null;
  }

  return data;
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
export async function createOrganisation(supabaseAdmin, submission, submissionId, companyId) {
  // Use fund/company name if given, else fall back to submitter's name
  const orgName =
    submission.company_fund_name ||
    submission.target_company_name ||
    `${submission.full_name || "User"}'s Organisation`;

  const now = new Date().toISOString();

  // "company" persona maps to "company" account_type; everything else "investor"
  const accountType = submission.persona_type === "company" ? "company" : "investor";

  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("organisations")
    .insert([
      {
        id: uuidv4(),
        name: orgName,
        account_type: accountType,
        lifecycle_status: "active",
        is_active: true,
        source: submission.source || "Landing Page",
        credit_balance: 0,
        metadata: {
          submission_id: submissionId,
          submitted_by: submission.email,
        },
        company_id: companyId || null,
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

  // If "company" persona (founder), is_founder = true, is_employee = false
  const isFounder = submission.persona_type === "company";
  const isEmployee = submission.persona_type !== "company";

  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("people")
    .insert([
      {
        id: uuidv4(),
        organisation_id: organisationId,
        full_name: submission.full_name || null,
        email: submission.email || null,
        is_employee: isEmployee,
        is_founder: isFounder,
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
  console.log(`[Provisioning] Step 5: createOrFindAuthUser for ${submission.email}`);
  
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
    console.log(`[Provisioning] Auth user created: ${created?.user?.id}`);
    return created?.user?.id || null;
  }

  // If user already exists, look them up
  const msg = createError.message?.toLowerCase() || "";
  if (!msg.includes("already")) {
    console.log(`[Provisioning] createUser error: ${createError.message}`);
    throw new Error(`createOrFindAuthUser failed: ${createError.message}`);
  }

  console.warn(`[Provisioning] Auth user already exists (${submission.email}), looking up...`);

  const { data: listed, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.log(`[Provisioning] listUsers error: ${listError.message}`);
    throw new Error(`listUsers failed: ${listError.message}`);
  }

  const existing = listed?.users?.find(
    (u) => u.email?.toLowerCase() === submission.email?.toLowerCase()
  );

  if (!existing) {
    console.log(`[Provisioning] User exists in Auth but not found in first batch of listUsers`);
    // Fallback: we still throw because we can't link without an ID
    throw new Error(`User exists in Auth but could not be retrieved. Please check Auth logs for ${submission.email}.`);
  }

  console.log(`[Provisioning] Existing Auth user found: ${existing.id}`);
  return existing.id;
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
  if (!reportTypeId) {
    console.warn("[Provisioning] createReport skipped: reportTypeId not found");
    return null;
  }

  const now = new Date().toISOString();

  const reportPayload = {
    id: uuidv4(),
    organisation_id: organisationId,
    report_type_id: reportTypeId,
    persona_variant: "investor",
    version: 1,
    // status intentionally omitted — let DB column default apply
    //   (reports_status_check rejects arbitrary values like "pending")
    visibility: "unlocked",
    source: "auto-provision",
    title: `Investor Report – ${submission.target_company_name || "Requested Company"}`,
    storage_path: null,
    generated_at: null,
    reviewed_by: appUserId,
    reviewed_at: null,
    created_at: now,
    updated_at: now,
  };

  // Only include company_id if we have one (column may be NOT NULL in some schemas)
  if (companyId) {
    reportPayload.company_id = companyId;
  }

  const { data, error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("reports")
    .insert([reportPayload])
    .select()
    .single();

  if (error) {
    // Non-fatal: report creation failing shouldn't block the full approval
    console.log("[Provisioning] createReport failed (non-fatal):", error.message);
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
  submissionId,
  resolvedIp
) {
  const { error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("event_log")
    .insert([
      {
        event_type: "submission_approved",
        organisation_id: organisationId,
        user_id: appUserId,
        ip_address: resolvedIp,
        metadata: {
          submission_id: submissionId,
          provisioned_at: new Date().toISOString(),
        },
      },
    ]);

  if (error) {
    // Non-fatal: don't block approval for a logging failure
    console.log("[Provisioning] insertEventLog failed (non-fatal):", error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Update submission with organisation_id
//    Ensures the submission is linked to the new org in Superadmin panel
// ─────────────────────────────────────────────────────────────────────────────
export async function updateSubmissionWithOrg(supabaseAdmin, submissionId, organisationId) {
  console.log(`[Provisioning] Step 9: Updating submission ${submissionId} with org ${organisationId}`);
  const { error } = await supabaseAdmin
    .schema(SCHEMA)
    .from("new_submissions")
    .update({ organisation_id: organisationId })
    .eq("id", submissionId);

  if (error) {
    console.warn(`[Provisioning] updateSubmissionWithOrg failed (non-fatal): ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ORCHESTRATOR
// Call this when status = "approved" and it's a fresh (not yet provisioned) submission
// ─────────────────────────────────────────────────────────────────────────────
export async function runApprovalProvisioningFlow(
  supabaseAdmin,
  submission,
  submissionId,
  resolvedIp
) {
  console.log("── Starting provisioning for submission:", submissionId, "Persona:", submission.persona_type);

  const isFounderFlow = submission.persona_type === "company";

  // Step 1: Lookup or Create company (Must happen BEFORE organisation)
  const targetUrl = submission.target_company_url;
  const targetName = submission.target_company_name;

  console.log(`[Provisioning] Step 1: Company lookup for URL: ${targetUrl}, Name: ${targetName}`);
  let company = await findCompanyByUrl(supabaseAdmin, targetUrl);

  if (!company && (targetName || targetUrl)) {
    console.log("[Provisioning] Company not found, creating new company record...");
    company = await createCompany(supabaseAdmin, targetName, targetUrl);
  }

  const companyId = company?.id || null;
  console.log(`[Provisioning] Company resolved: ${companyId ? `${company.name} (${companyId})` : "NONE"}`);

  // Step 2: Skip report type for Founder flow
  let reportTypeId = null;
  if (!isFounderFlow) {
    console.log("[Provisioning] Step 2: Getting report type ID...");
    reportTypeId = await getDefaultReportTypeId(supabaseAdmin);
    console.log(`[Provisioning] Report type ID resolved: ${reportTypeId ?? "NOT FOUND"}`);
  }

  // Step 3: Create organisation
  console.log("[Provisioning] Step 3: Creating organisation...");
  const organisation = await createOrganisation(supabaseAdmin, submission, submissionId, companyId);
  console.log(`[Provisioning] Organisation created: ${organisation.id}`);

  // Step 4: Create person
  console.log("[Provisioning] Step 4: Creating person record...");
  const person = await createPerson(supabaseAdmin, organisation.id, submission);
  console.log(`[Provisioning] Person created: ${person.id}`);

  // If it's a Founder flow, we stop here (company, organisation, people entry only)
  if (isFounderFlow) {
    console.log("[Provisioning] Founder flow: Skipping Auth/App User/Report creation as requested.");
    
    // Step 9: Link submission to organisation
    await updateSubmissionWithOrg(supabaseAdmin, submissionId, organisation.id);

    console.log("── Provisioning (Founder) complete for submission:", submissionId);
    return {
      organisationId: organisation.id,
      personId: person.id,
      authUserId: null,
      appUserId: null,
      reportId: null,
      companyMatched: !!companyId,
      reportTypeFound: false,
    };
  }

  // Step 5: (Investor Only) Create / find auth user
  const authUserId = await createOrFindAuthUser(supabaseAdmin, submission);
  if (!authUserId) {
    throw new Error("Failed to resolve Auth User ID. Account provisioning cannot continue.");
  }

  // LOG ACCOUNT_CREATED for Investor
  await supabaseAdmin.schema(SCHEMA).from("event_log").insert([{
    event_type: "investor.account.created",
    organisation_id: organisation.id,
    ip_address: resolvedIp,
    metadata: { submission_id: submissionId }
  }]);

  // Step 6: (Investor Only) Create app user
  console.log("[Provisioning] Step 6: Creating app user...");
  const appUser = await createAppUser(
    supabaseAdmin,
    person.id,
    organisation.id,
    authUserId,
    submission
  );
  console.log(`[Provisioning] App user created: ${appUser.id}`);

  // LOG USER_CREATED for Investor
  await supabaseAdmin.schema(SCHEMA).from("event_log").insert([{
    event_type: "investor.user.created",
    user_id: appUser.id,
    organisation_id: organisation.id,
    ip_address: resolvedIp,
  }]);

  // Step 7: (Investor Only) Create free report (non-fatal if it fails)
  console.log("[Provisioning] Step 7: Creating initial report...");
  const report = await createReport(
    supabaseAdmin,
    organisation.id,
    companyId,
    reportTypeId,
    appUser.id,
    submission
  );
  console.log(`[Provisioning] Report resolved: ${report?.id ?? "SKIPPED/FAILED"}`);

  if (report?.id) {
    // LOG REPORT_REQUESTED for Investor
    await supabaseAdmin.schema(SCHEMA).from("event_log").insert([{
      event_type: "investor.report.requested",
      user_id: appUser.id,
      organisation_id: organisation.id,
      report_id: report.id,
      company_id: companyId,
      ip_address: resolvedIp
    }]);
  }

  // Step 8: (Investor Only) Event log (non-fatal) - Default Submission Approved Log
  console.log("[Provisioning] Step 8: Inserting event log...");
  await insertEventLog(supabaseAdmin, organisation.id, appUser.id, submissionId, resolvedIp);

  // Step 9: Link submission to organisation
  await updateSubmissionWithOrg(supabaseAdmin, submissionId, organisation.id);

  console.log("── Provisioning (Investor) complete for submission:", submissionId);

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
