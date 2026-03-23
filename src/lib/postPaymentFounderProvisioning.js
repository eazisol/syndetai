"use client";

import { VAT_RATE } from "@/config/packagesConfig";

// Mapping from selected plan title -> one or more logical report_type.name values
// used in the report_types table. This controls how many rows we create in `reports`.
const REPORT_TYPE_NAME_BY_TITLE = {
  // 1 report
  "Pre-Diligence Assessment": ["due_diligence"],
  "Company Research Report": ["due_diligence"],
  due_diligence: ["due_diligence"],

  // 2 reports
  "Competitive Positioning Assessment": [
    "due_diligence",
    "competitor_analysis",
  ],
  "Competitive Analysis": ["due_diligence", "competitor_analysis"],
  competitor_analysis: ["due_diligence", "competitor_analysis"],

  // 3 reports
  "Fundraising Readiness Diagnostic": [
    "due_diligence",
    "competitor_analysis",
    "full_research_report",
  ],
  "Company Deep Dive": [
    "due_diligence",
    "competitor_analysis",
    "full_research_report",
  ],
  full_research_report: [
    "due_diligence",
    "competitor_analysis",
    "full_research_report",
  ],
};

function derivePricingModel(itemType) {
  if (itemType === "Annual") return "subscription";
  if (itemType === "One-off") return "one_off";
  throw new Error(
    `Unknown billing type for pricing_model: ${itemType || "MISSING"}`,
  );
}

function parseDomain(url) {
  if (!url) return null;
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const u = new URL(normalized);
    return u.hostname || null;
  } catch {
    return null;
  }
}

async function ensureCompany({ supabase, founderData }) {
  const name = founderData.companyName?.trim();
  const website = founderData.website?.trim();

  if (!name) {
    throw new Error("Company name is required for company provisioning.");
  }

  const website_domain = website ? parseDomain(website) : null;

  // Try to find existing by website_domain first, then by name
  let existing = null;

  if (website_domain) {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("website_domain", website_domain)
      .maybeSingle();

    if (error) throw error;
    existing = data;
  }

  if (!existing) {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .ilike("name", name)
      .maybeSingle();

    if (error) throw error;
    existing = data;
  }

  if (existing) {
    return existing;
  }

  const insertPayload = {
    name,
    website,
    website_domain,
    source: "founder_checkout",
    sector: null,
    geography: null,
    metadata: {
      origin: "founder_checkout",
      created_at: new Date().toISOString(),
    },
  };

  const { data: created, error: insertError } = await supabase
    .from("companies")
    .insert([insertPayload])
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

async function ensureOrganisation({ supabase, company, founderData }) {
  const { data: existing, error } = await supabase
    .from("organisations")
    .select("*")
    .eq("company_id", company.id)
    .maybeSingle();

  if (error) throw error;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("organisations")
      .update({
        name: founderData.companyName || existing.name,
        account_type: existing.account_type || "company",
        lifecycle_status: existing.lifecycle_status || "active",
        is_active: true,
        source: existing.source || "founder_checkout",
        metadata: {
          ...(existing.metadata || {}),
          last_checkout_at: new Date().toISOString(),
        },
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  const insertPayload = {
    name: founderData.companyName,
    account_type: "company",
    lifecycle_status: "active",
    metadata: {
      origin: "founder_checkout",
      created_at: new Date().toISOString(),
    },
    credit_balance: 0,
    is_active: true,
    source: "founder_checkout",
    company_id: company.id,
  };

  const { data: created, error: insertError } = await supabase
    .from("organisations")
    .insert([insertPayload])
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

async function ensureFounderPerson({ supabase, organisation, founderData }) {
  const email = founderData.email?.trim();
  const full_name = founderData.fullName?.trim() || founderData.name?.trim();

  if (!email || !full_name) {
    throw new Error(
      "Founder full name and email are required for people provisioning.",
    );
  }

  const { data: existing, error } = await supabase
    .from("people")
    .select("*")
    .eq("organisation_id", organisation.id)
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("people")
      .update({
        full_name,
        is_founder: true,
        is_employee: existing.is_employee ?? false,
        is_board: existing.is_board ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  const now = new Date().toISOString();
  const insertPayload = {
    organisation_id: organisation.id,
    full_name,
    email,
    is_founder: true,
    is_employee: false,
    is_board: false,
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertError } = await supabase
    .from("people")
    .insert([insertPayload])
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

async function ensureUser({ supabase, organisation, person, authUserId, founderData }) {
  if (!authUserId) {
    throw new Error("authUserId is required to provision users row.");
  }

  const now = new Date().toISOString();

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("*")
    .eq("person_id", person.id)
    .maybeSingle();

  if (existingUserError) throw existingUserError;

  if (existingUser) {
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        organisation_id: organisation.id,
        auth_user_id: authUserId,
        email: founderData.email,
        username: person.full_name,
        is_admin: true,
        is_superadmin: false,
        is_active: true,
        updated_at: now,
      })
      .eq("id", existingUser.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedUser;
  }

  const payload = {
    id: authUserId,
    person_id: person.id,
    organisation_id: organisation.id,
    auth_user_id: authUserId,
    email: founderData.email,
    username: person.full_name,
    is_admin: true,
    is_superadmin: false,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const { data: createdUser, error: insertError } = await supabase
    .from("users")
    .insert([payload])
    .select()
    .single();

  if (insertError) throw insertError;
  return createdUser;
}

async function createPurchase({
  supabase,
  organisation,
  cartItem,
  total,
  paymentIntent,
}) {
  const payload = {
    organisation_id: organisation.id,
    purchase_type: "product",
    pricing_model: cartItem.type === "Annual" ? "annual" : "one_off",
    amount_gbp: total,
    vat_amount_gbp: 0,
    total_amount_gbp: total,
    currency: "gbp",
    payment_status: "completed",
    payment_ref: paymentIntent?.id || "manual",
    metadata: {
      items: [cartItem],
    },
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("purchases").insert([payload]);
  if (error) {
    console.log("createPurchase failed:", error.message);
    throw error;
  }
}

async function createReportForPurchase({ supabase, company, organisation, cartItem }) {
  const planTitleRaw = cartItem.title || "";
  const planIdRaw = cartItem.id || "";

  const reportTypeNames =
    REPORT_TYPE_NAME_BY_TITLE[planTitleRaw] || REPORT_TYPE_NAME_BY_TITLE[planIdRaw];

  if (!reportTypeNames || reportTypeNames.length === 0) {
    console.warn(`[createReportForPurchase] No report type mapping for: ${planTitleRaw}`);
    return;
  }

  const { data: reportTypes, error: rtError } = await supabase
    .from("report_types")
    .select("id, name")
    .in("name", reportTypeNames);

  if (rtError) throw rtError;
  if (!reportTypes || reportTypes.length === 0) {
    console.warn(`[createReportForPurchase] No report_types found for: ${reportTypeNames}`);
    return;
  }

  const rows = [];

  for (const rt of reportTypes) {
    const { data: existingReports, error: existingError } = await supabase
      .from("reports")
      .select("id, version, status")
      .eq("company_id", company.id)
      .eq("organisation_id", organisation.id)
      .eq("report_type_id", rt.id)
      .eq("persona_variant", "company")
      .order("version", { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    const latest = existingReports?.[0] || null;

    if (latest && ["queued", "in_progress", "review", "completed"].includes(latest.status)) {
      console.log(
        `[createReportForPurchase] Report already exists for company ${company.id}, report_type ${rt.id}, latest version ${latest.version}, status ${latest.status}. Skipping new insert.`
      );
      continue;
    }

    const nextVersion = latest ? Number(latest.version || 0) + 1 : 1;

  rows.push({
  company_id: company.id,
  organisation_id: organisation.id,
  report_type_id: rt.id,
  title: `${rt.name} report for ${company.name}`,
  persona_variant: "company",
  version: nextVersion,
  source: "founder_checkout",
});
  }

  if (!rows.length) {
    console.log("[createReportForPurchase] No new report rows to insert");
    return;
  }

  const { data: insertedReports, error: insertError } = await supabase
    .from("reports")
    .insert(rows)
    .select();

  if (insertError) {
    console.log("createReportForPurchase insert failed:", insertError.message);
    throw insertError;
  }

  console.log("Reports created successfully:", insertedReports);
}

async function createFounderSubmission({
  supabase,
  company,
  organisation,
  founderData,
  cartItem,
}) {
  const payload = {
    persona_type: "company",
    full_name: founderData.fullName,
    email: founderData.email,
    status: "pending",
    company_fund_name: null,
    target_company_name: null,
    own_company_name: founderData.companyName,
    own_company_url: founderData.website,
    free_text: null,
    source: "founder_checkout",
  };

  const { error } = await supabase.from("new_submissions").insert([payload]);
  if (error) throw error;
}

export async function provisionFounderPurchase({
  supabase,
  paymentIntent,
  formData,
  items,
  total,
  existingCompanyId = null,
  existingPersonId = null,
}) {
  if (!supabase) throw new Error("Supabase client is required.");
  if (!paymentIntent) throw new Error("paymentIntent is required.");
  if (!items || items.length === 0)
    throw new Error("At least one cart item is required.");

  const cartItem = items[0];

  const founderData = {
    fullName: `${formData.firstName} ${formData.lastName}`.trim(),
    name: `${formData.firstName} ${formData.lastName}`.trim(),
    email: formData.email,
    companyName: formData.companyName,
    website: null,
  };

  // Try to enrich with landing-page founder form data from localStorage (if present)
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("syndet_founder_form");
      if (raw) {
        const parsed = JSON.parse(raw);
        founderData.website = parsed.website || founderData.website;
        founderData.companyName = parsed.companyName || founderData.companyName;
      }
    } catch {
      // ignore parse/storage errors, remain strict on required fields later
    }
  }

  // 1. Ensure/Resolve Company
  let company;
  if (existingCompanyId) {
    console.log(
      "provisionFounderPurchase: using existing companyId:",
      existingCompanyId,
    );
    const { data: extComp, error: compErr } = await supabase
      .from("companies")
      .select("*")
      .eq("id", existingCompanyId)
      .maybeSingle();

    if (compErr) throw compErr;
    if (!extComp) {
      // Fallback if ID was invalid but provided
      company = await ensureCompany({ supabase, founderData });
    } else {
      company = extComp;
    }
  } else {
    company = await ensureCompany({ supabase, founderData });
  }

  // 2. Ensure/Resolve Organisation
  const organisation = await ensureOrganisation({
    supabase,
    company,
    founderData,
  });

  // 3. Provision auth user + users/people
  let authUserId = null;

  // Check if user already exists for this email to avoid duplicate auth signup errors
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, auth_user_id, person_id, email")
    .eq("email", founderData.email)
    .maybeSingle();


  if (existingUser?.auth_user_id) {
    authUserId = existingUser.auth_user_id;
    console.log(
      "provisionFounderPurchase: user already exists in DB, using auth_user_id:",
      authUserId,
    );
  } else {
    try {
      const tempPwd = "User" + Math.random().toString(36).slice(-8) + "!";
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: founderData.email,
        password: tempPwd,
        options: {
          data: {
            full_name: founderData.fullName,
          },
        },
      });

      if (authErr && !authErr.message.includes("already registered")) {
        throw authErr;
      }

      if (authData?.user?.id) {
        authUserId = authData.user.id;
      } else {
        // If they were already registered, we might need to find them, but signUp sometimes doesn't return the user object on duplicate
        // For simplicity, we assume if we reach here and authUserId is null but signup errored with "already registered",
        // we might have a gap. But usually, ensureUser will handle it or fail gracefully.
      }
    } catch (e) {
      if (!e.message.includes("already registered")) {
        throw new Error(`Auth provisioning failed: ${e.message || String(e)}`);
      }
    }
  }

  // 4. Resolve/Provision Person
  let person;
  if (existingPersonId) {
    console.log(
      "provisionFounderPurchase: using existing personId:",
      existingPersonId,
    );
    const { data: extPerson, error: persErr } = await supabase
      .from("people")
      .select("*")
      .eq("id", existingPersonId)
      .maybeSingle();

    if (persErr) throw persErr;
    if (extPerson) {
      person = extPerson;
    } else {
      person = await ensureFounderPerson({
        supabase,
        organisation,
        founderData,
      });
    }
  } else {
    person = await ensureFounderPerson({ supabase, organisation, founderData });
  }

  // 5. Ensure User row exists if authUserId was resolved
  let userRow = null;
  if (authUserId) {
    userRow = await ensureUser({
      supabase,
      organisation,
      person,
      authUserId,
      founderData,
    });
  }

  // 6. Create the report row based on the purchased plan and report_types mapping
  await createReportForPurchase({ supabase, company, organisation, cartItem });

  // 7. Then create the purchase record pointing at this organisation
  await createPurchase({
    supabase,
    organisation,
    cartItem,
    total,
    paymentIntent,
  });

  // 8. Create a submission record to track this new request
  await createFounderSubmission({
    supabase,
    company,
    organisation,
    founderData,
    cartItem,
  });

  return {
    companyId: company.id,
    organisationId: organisation.id,
    personId: person.id,
    authUserId,
    userId: userRow?.id || null,
  };
}
