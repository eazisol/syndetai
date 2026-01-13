import { getSupabase } from "@/supabaseClient";

export async function processConnectRedirect({ router, companyId, userUuid }) {
  if (!companyId || !userUuid) {
    console.error("Missing companyId or uuid");
    router.push("/product");
    return;
  }

  try {
    const supabase = getSupabase();

    // 1. Validate: Check if the User (uuid) belongs to the Company (companyId)
    const { data: userData, error: userError } = await supabase
      .from("company_people")
      .select("company_id")
      .eq("id", userUuid)
      .maybeSingle();

    if (userError || !userData) {
      console.error("Validation failed: User not found");
      router.push(`/product?company_id=${companyId}`);
      return;
    }

    if (userData.company_id !== companyId) {
      console.error("Validation failed: Company ID mismatch");
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
      console.error("Error fetching IP:", ipError);
    }

    const { error: logError } = await supabase
      .from("event_logs")
      .insert([
        {
          company_id: companyId,
          ip_address: ipAddress,
          // user_id skipped
        },
      ]);

    if (logError) {
      console.error("Error logging event:", logError);
    } else {
      console.log("Event logged successfully");
    }
  } catch (err) {
    console.error("System error:", err);
  } finally {
    // 3. Redirect to Product with Company ID (same)
    router.push(`/product?company_id=${companyId}`);
  }
}
