import { getSupabase } from "@/supabaseClient";

/**
 * Logs an event to the event_logs table in Supabase.
 * @param {Object} params
 * @param {string} params.companyId - The ID of the company.
 * @param {string} params.userId - The ID of the user (UUID).
 * @param {string} params.eventType - The type of event (e.g., "Add to cart: Package Name", "Pay now", "Payment Success").
 */
export async function logEvent({ companyId, userId, eventType }) {
  if (!companyId || !userId) {
    console.warn("logEvent: Missing companyId or userId", { companyId, userId, eventType });
    return;
  }

  try {
    const supabase = getSupabase();

    // Fetch IP address
    let ipAddress = null;
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      ipAddress = data.ip;
    } catch (ipError) {
      console.log("Error fetching IP:", ipError);
    }

    const { data, error } = await supabase
      .from("event_logs")
      .insert([
        {
          company_id: companyId,
          user_id: userId,
          ip_address: ipAddress,
          event_type: eventType,
        },
      ])
      .select();

    if (error) {
      console.error("Error logging event:", error);
    } else {
      console.log("Event logged successfully:", data);
    }
  } catch (err) {
    console.error("Error in logEvent:", err);
  }
}
