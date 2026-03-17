"use client";

import { VAT_RATE } from "@/config/packagesConfig";

// Mapping from selected plan title -> one or more logical report_type.name values
// used in the report_types table. This controls how many rows we create in `reports`.
const REPORT_TYPE_NAME_BY_TITLE = {
  // 1 report
  "Pre-Diligence Assessment": ["due_diligence"],
  // 2 reports
  "Competitive Positioning Assessment": ["due_diligence", "competitor_analysis"],
  // 3 reports
  "Fundraising Readiness Diagnostic": [
    "due_diligence",
    "competitor_analysis",
    "full_research_report",
  ],
};

function derivePricingModel(itemType) {
  if (itemType === "Annual") return "subscription";
  if (itemType === "One-off") return "one_off";
  throw new Error(`Unknown billing type for pricing_model: ${itemType || "MISSING"}`);
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

  if (!name || !website) {
    throw new Error("Company name and website are required for company provisioning.");
  }

  const website_domain = parseDomain(website);

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
    throw new Error("Founder full name and email are required for people provisioning.");
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

  const { error } = await supabase.from("users").upsert([payload]);
  if (error) throw error;
}

async function createPurchase({ supabase, organisation, cartItem, total, paymentIntent }) {
  const pricing_model = derivePricingModel(cartItem.type);

  const subtotal = total / (1 + VAT_RATE);
  const vatAmount = total - subtotal;

  const payload = {
    organisation_id: organisation.id,
    // For now, all founder purchases are treated as a single product purchase
    // Allowed values (per purchases_purchase_type_check) are: 'credit_bundle', 'product'
    purchase_type: "product",
    pricing_model,
    amount_gbp: Number(subtotal.toFixed(2)),
    vat_amount_gbp: Number(vatAmount.toFixed(2)),
    total_amount_gbp: Number(total.toFixed(2)),
    currency: paymentIntent?.currency || "gbp",
  };

  const { error } = await supabase.from("purchases").insert([payload]);
  if (error) throw error;
}

async function createReportForPurchase({ supabase, company, organisation, cartItem }) {
  const planTitle = cartItem.title || "";
  const reportTypeNames = REPORT_TYPE_NAME_BY_TITLE[planTitle];

  if (!reportTypeNames || reportTypeNames.length === 0) {
    throw new Error(
      `No report type mapping configured for plan title "${planTitle}". Please update REPORT_TYPE_NAME_BY_TITLE.`
    );
  }

  console.log("createReportForPurchase: resolving report_types", {
    companyId: company.id,
    organisationId: organisation.id,
    planTitle,
    reportTypeNames,
  });

  // 1) Look up all needed report_types by name
  const { data: reportTypes, error: rtError } = await supabase
    .from("report_types")
    .select("id, name")
    .in("name", reportTypeNames);

  if (rtError) throw rtError;
  if (!reportTypes || reportTypes.length !== reportTypeNames.length) {
    throw new Error(
      `One or more report_types rows not found for names [${reportTypeNames.join(
        ", "
      )}].`
    );
  }

  const now = new Date().toISOString();

  // 2) Insert one row per report_type into reports
  const rows = reportTypes.map((rt) => ({
    company_id: company.id,
    organisation_id: organisation.id,
    report_type_id: rt.id,
    persona_variant: "company",
    version: 1,
    status: "queued",
    visibility: "unlocked",
    source: "founder_checkout",
    // Keep the plan title as-is so UI knows which product created these
    title: planTitle,
    storage_path: null,
    generated_at: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
    updated_at: now,
  }));

  const { data: created, error: insertError } = await supabase
    .from("reports")
    .insert(rows)
    .select("id, report_type_id");

  if (insertError) throw insertError;

  console.log("createReportForPurchase: created reports", created);
  return created;
}

async function createFounderSubmission({ supabase, company, organisation, founderData, cartItem }) {
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
}) {
  if (!supabase) throw new Error("Supabase client is required.");
  if (!paymentIntent) throw new Error("paymentIntent is required.");
  if (!items || items.length === 0) throw new Error("At least one cart item is required.");

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

  const company = await ensureCompany({ supabase, founderData });
  const organisation = await ensureOrganisation({ supabase, company, founderData });

  // Provision auth user + users/people
  let authUserId = null;
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

    if (authErr) {
      throw authErr;
    }
    authUserId = authData?.user?.id || null;
  } catch (e) {
    throw new Error(`Auth provisioning failed: ${e.message || String(e)}`);
  }

  const person = await ensureFounderPerson({ supabase, organisation, founderData });
  await ensureUser({ supabase, organisation, person, authUserId, founderData });

  // 1) Create the report row based on the purchased plan and report_types mapping
  await createReportForPurchase({ supabase, company, organisation, cartItem });

  // 2) Then create the purchase record pointing at this organisation
  await createPurchase({ supabase, organisation, cartItem, total, paymentIntent });
  await createFounderSubmission({ supabase, company, organisation, founderData, cartItem });

  return {
    companyId: company.id,
    organisationId: organisation.id,
    personId: person.id,
    authUserId,
  };
}

