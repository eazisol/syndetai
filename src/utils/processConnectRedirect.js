import { getSupabase } from "@/supabaseClient";

export async function processConnectRedirect({ router, companyId, userUuid }) {
  if (!companyId || !userUuid) {
    console.log("Missing companyId or uuid");
    router.push("/product");
    return;
  }

  try {
    const supabase = getSupabase();

    // 1. Validate: Check if the User (uuid) belongs to the Company (companyId)
    const { data: userData, error: userError } = await supabase
      .from("people")
      .select("organisation_id")
      .eq("id", userUuid)
      .maybeSingle();

    if (userError || !userData || !userData.organisation_id) {
      console.log("Validation failed: User or organisation not found");
      router.push(`/product?company_id=${companyId}`);
      return;
    }

    const { data: orgData, error: orgError } = await supabase
      .from("organisations")
      .select("company_id")
      .eq("id", userData.organisation_id)
      .maybeSingle();

    if (orgError || !orgData) {
      console.log("Validation failed: Organisation or Company ID not found");
      router.push(`/product?company_id=${companyId}`);
      return;
    }

    if (orgData.company_id !== companyId) {
      console.log("Validation failed: Company ID mismatch");
      router.push(`/product?company_id=${companyId}`);
      return;
    }

    // 2. Log Event (same)
    let ipAddress = null;
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      ipAddress = data.ip;
    } catch (ipError) {
      console.log("Error fetching IP:", ipError);
    }

    const { error: logError } = await supabase.from("event_log").insert([
      {
        company_id: companyId,
        ip_address: ipAddress,
        user_id: userUuid,
        event_type: "landing",
      },
    ]);

    if (logError) {
      console.log("Error logging event:", logError);
    } else {
      console.log("Event logged successfully");
    }
  } catch (err) {
    console.log("System error:", err);
  } finally {
    // 3. Redirect to Product with Company ID (same)
    router.push(`/product?company_id=${companyId}`);
  }
}
