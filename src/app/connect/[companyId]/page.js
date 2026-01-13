// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useParams, useSearchParams } from "next/navigation";
// import { getSupabase } from "@/supabaseClient";

// export default function ConnectPage() {
//     const router = useRouter();
//     const params = useParams();
//     const searchParams = useSearchParams();
//     const companyId = params.companyId;
//     const userUuid = searchParams.get("uuid");
//     const [status, setStatus] = useState("Processing...");

//     useEffect(() => {
//         const processConnect = async () => {
//             // Basic check
//             if (!companyId || !userUuid) {
//                 console.error("Missing companyId or uuid");
//                 router.push("/product");
//                 return;
//             }

//             try {
//                 const supabase = getSupabase();

//                 // 1. Validate: Check if the User (uuid) belongs to the Company (companyId)
//                 const { data: userData, error: userError } = await supabase
//                     .from("company_people")
//                     .select("company_id")
//                     .eq("id", userUuid)
//                     .maybeSingle();

//                 if (userError || !userData) {
//                     console.error("Validation failed: User not found");
//                     // Redirect even on error to standard home view?
//                     // User instructions imply removing token. We will redirect to home.
//                     // If we have companyId, we pass it.
//                     router.push(`/product?company_id=${companyId}`);
//                     return;
//                 }

//                 if (userData.company_id !== companyId) {
//                     console.error("Validation failed: Company ID mismatch");
//                     router.push(`/product?company_id=${companyId}`);
//                     return;
//                 }

//                 // 2. Log Event
//                 let ipAddress = null;
//                 try {
//                     const res = await fetch("https://api.ipify.org?format=json");
//                     const data = await res.json();
//                     ipAddress = data.ip;
//                 } catch (ipError) {
//                     console.error("Error fetching IP:", ipError);
//                 }

//                 const { error: logError } = await supabase
//                     .from("event_logs")
//                     .insert([
//                         {
//                             company_id: companyId,
//                             ip_address: ipAddress,
//                             // user_id skipped
//                         }
//                     ]);

//                 if (logError) {
//                     console.error("Error logging event:", logError);
//                 } else {
//                     console.log("Event logged successfully");
//                 }

//             } catch (err) {
//                 console.error("System error:", err);
//             } finally {
//                 // 3. Redirect to Product with Company ID
//                 router.push(`/product?company_id=${companyId}`);
//             }
//         };

//         processConnect();
//     }, [companyId, userUuid, router]);

//     return (
//         // <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "20px" }}>
//         //     <div style={{ fontSize: "1.2rem", fontWeight: "500" }}>{status}</div>
//         //     <div style={{ fontSize: "0.9rem", color: "#666" }}>Redirecting to Product Landing Page...</div>
//         // </div>
//         <>

//         </>
//     );
// }
