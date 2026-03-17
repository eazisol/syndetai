// src/app/api/approve-submission/route.js
// Step-by-step build:
// ✅ Step 1: Update status in new_submissions
// ✅ Step 2–8: Full provisioning flow (organisation → people → auth user →
//             users → report → event_log) via lib/approvalProvisioning.js

import { createClient } from "@supabase/supabase-js";
import { runApprovalProvisioningFlow } from "@/lib/approvalProvisioning";

export const runtime = "nodejs";

const REJECTED_DB_VALUE = "rejected";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeStatus(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "approved") return "approved";
  if (value === "pending") return "pending";
  if (value === "reject" || value === "rejected") return REJECTED_DB_VALUE;
  return null;
}

export async function POST(req) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: "Missing Supabase configuration" }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    console.log("── approve-submission called, body:", body);

    const submissionId = body.submissionId;
    // Default to "approved" if caller omits status (endpoint name implies it)
    const targetStatus = normalizeStatus(body.status ?? "approved");

    // ── Validate ─────────────────────────────────────────────────────────────
    if (!submissionId) {
      return jsonResponse({ error: "submissionId is required" }, 400);
    }

    if (!targetStatus) {
      return jsonResponse(
        {
          error: "Invalid status. Allowed values: approved, rejected, reject, pending",
          receivedStatus: body.status ?? null,
        },
        400
      );
    }

    // ── Step 1a: Fetch submission ─────────────────────────────────────────────
    const { data: submission, error: fetchError } = await supabaseAdmin
      .schema("syndet")
      .from("new_submissions")
      .select("*")
      .eq("id", submissionId)
      .maybeSingle();

    if (fetchError) {
      return jsonResponse(
        { error: `Failed to fetch submission: ${fetchError.message}` },
        500
      );
    }

    if (!submission) {
      return jsonResponse({ error: "Submission not found", submissionId }, 404);
    }

    // ── Step 1b: Update status ────────────────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .schema("syndet")
      .from("new_submissions")
      .update({
        status: targetStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (updateError) {
      return jsonResponse(
        { error: `Failed to update submission status: ${updateError.message}` },
        500
      );
    }

    console.log(`Submission ${submissionId} status → "${targetStatus}"`);

    // ── If not "approved", we're done ────────────────────────────────────────
    if (targetStatus !== "approved") {
      return jsonResponse({
        success: true,
        step: "status_updated",
        submissionId,
        newStatus: targetStatus,
        message: `Submission status updated to "${targetStatus}"`,
      });
    }

    // ── Steps 2–8: Full provisioning flow ────────────────────────────────────
    // Check if already provisioned (organisation with this submission_id in metadata)
    const { data: existingOrg } = await supabaseAdmin
      .schema("syndet")
      .from("organisations")
      .select("id, name")
      .contains("metadata", { submission_id: submissionId })
      .maybeSingle();

    if (existingOrg) {
      console.log("Already provisioned, org:", existingOrg.id);
      return jsonResponse({
        success: true,
        step: "already_provisioned",
        submissionId,
        organisationId: existingOrg.id,
        message: "Submission was already provisioned. Status updated to approved.",
      });
    }

    // Run the full provisioning flow
    const result = await runApprovalProvisioningFlow(
      supabaseAdmin,
      submission,
      submissionId
    );

    return jsonResponse({
      success: true,
      step: "fully_provisioned",
      submissionId,
      newStatus: "approved",
      ...result,
      message: result.reportId
        ? "Submission approved and fully provisioned (org, user, report created)"
        : "Submission approved and provisioned. Report skipped — company or report type not found.",
    });

  } catch (error) {
    console.log("── approve-submission error:", error);
    return jsonResponse(
      { error: error.message || "Something went wrong" },
      500
    );
  }
}