import { getSupabase } from "@/supabaseClient";

/**
 * Logs an event to the event_log table in Supabase.
 * @param {Object} params
//  * @param {string} params.companyId - The ID of the company.
//  * @param {string} params.userId - The ID of the user (UUID).
 * @param {string} params.eventType - The type of event (e.g., "Add to cart: Package Name",
 * @param {string} params.eventType - The type of event.
 * @param {string} [params.companyId] - The ID of the company.
 * @param {string} [params.userId] - The ID of the user (UUID).
 * @param {string} [params.organisationId] - The ID of the organisation.
 * @param {string} [params.reportId] - The ID of the report.
 * @param {string} [params.campaignId] - The ID of the campaign.
 */
export async function logEvent({
  eventType,
  companyId = null,
  userId = null,
  organisationId = null,
  reportId = null,
  campaignId = null,
  submissionId = null,
  subscriptionId = null,
  ipAddress = null,
  metadata = null
}) {
  // At least one identifier should be present, though we primarily check for eventType
  if (!eventType) {
    console.warn("logEvent: Missing eventType");
    return;
  }

  try {
    const supabase = getSupabase();

    // Fetch IP address if not provided
    if (!ipAddress) {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        if (res.ok) {
          const data = await res.json();
          ipAddress = data.ip;
        }
      } catch (ipError) {
        console.log("Error fetching IP:", ipError);
      }
    }

    const { data, error } = await supabase
      .from("event_log")
      .insert([
        {
          company_id: companyId,
          user_id: userId,
          organisation_id: organisationId,
          report_id: reportId,
          campaign_id: campaignId,
          submission_id: submissionId,
          subscription_id: subscriptionId,
          ip_address: ipAddress,
          event_type: eventType,
          metadata: metadata
        },
      ])
      .select();

    if (error) {
      console.log("Error logging event:", error);
    } else {
      console.log("Event logged successfully:", eventType);
    }
  } catch (err) {
    console.log("Error in logEvent:", err);
  }
}
