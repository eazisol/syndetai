"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabase } from "@/supabaseClient";
import HomePage from "@/components/newdesign/HomePage";
import { CartProvider } from "@/components/newdesign/CartContext";
import Page404 from "@/components/newdesign/Page404";
import TeaserPreview from "@/components/TeaserPreview";
import { processConnectRedirect } from "@/utils/processConnectRedirect";

function ProtectedHome() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const uuid = searchParams?.get("uuid");
  const companyIdParam = searchParams?.get("company_id");

  console.log("ProductPage: Mounted", { uuid, companyIdParam });

  // State for UUID/Teaser Flow
  const [isValidUuid, setIsValidUuid] = useState(false);
  const [isLoadingUuid, setIsLoadingUuid] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showFullProduct, setShowFullProduct] = useState(false);
  const [teaserLogId, setTeaserLogId] = useState(null); // Store the teaser log entry ID

  // Ref to track if we have already logged the teaser view
  const hasLoggedTeaser = React.useRef(false);

  // Handler for "Open Full Report" button
  const handleOpenFullReport = async () => {
    console.log("handleOpenFullReport called");
    console.log("Current State:", { companyId, uuid });

    if (!companyId || !uuid) {
      console.log("Missing companyId or uuid in handleOpenFullReport");
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

      // Insert a new log entry for "landing" activity
      const { data: logData, error: logError } = await supabase
        .from("event_logs")
        .insert([
          {
            company_id: companyId,
            ip_address: ipAddress,
            event_type: "landing",
            user_id: uuid,
          },
        ])
        .select();

      if (logError) {
        console.log("Error logging event:", logError);
      } else {
        console.log("Event logged successfully:", logData);
      }

      // Show full product
      setShowFullProduct(true);
    } catch (err) {
      console.log("Error in handleOpenFullReport:", err);
    }
  };

  // Runs ONLY when both uuid + company_id exist
  useEffect(() => {
    if (uuid && companyIdParam) {
      processConnectRedirect({
        router,
        companyId: companyIdParam,
        userUuid: uuid,
      });
    }
  }, [uuid, companyIdParam, router]);

  // TEASER FLOW (just guarded so it runs ONLY when uuid exists WITHOUT company_id)
  useEffect(() => {
    const checkLogic = async () => {
      // Priority: UUID teaser flow only when there is NO company_id
      if (uuid && !companyIdParam) {
        setIsLoadingUuid(true);
        try {
          const supabase = getSupabase();

          // 1. Verify UUID exists in company_people
          const { data: userData, error: userError } = await supabase
            .from("company_people")
            .select("company_id")
            .eq("id", uuid)
            .maybeSingle();

          if (userError || !userData || !userData.company_id) {
            console.error("User not found or no company_id");
            setIsValidUuid(false);
            setIsLoadingUuid(false);
            return;
          }

          const userCompanyId = userData.company_id;

          // 2. Check for Teaser Document and get company_id from research_documents
          const { data: docData, error: docError } = await supabase
            .from("research_documents")
            .select("company_id, storage_path")
            .eq("company_id", userCompanyId)
            .eq("doc_type", "teaser")
            .limit(1);

          if (docError || !docData || docData.length === 0) {
            setIsValidUuid(false);
          } else {
            setIsValidUuid(true);
            // Use company_id from research_documents table
            setCompanyId(docData[0].company_id);
            setPdfUrl(docData[0].storage_path);

            // Log Teaser Activity (ONLY IF NOT LOGGED YET)
            if (!hasLoggedTeaser.current) {
              hasLoggedTeaser.current = true;

              let ipAddress = null;
              try {
                const res = await fetch("https://api.ipify.org?format=json");
                const data = await res.json();
                ipAddress = data.ip;
              } catch (ipError) {
                console.log("Error fetching IP:", ipError);
              }

              const { data: logData, error: logError } = await supabase
                .from("event_logs")
                .insert([
                  {
                    company_id: docData[0].company_id,
                    ip_address: ipAddress,
                    event_type: "teaser",
                    user_id: uuid, //  Log user_id from UUID
                  },
                ])
                .select();

              if (logError) {
                console.log("Error logging teaser view:", logError);
              } else if (logData && logData.length > 0) {
                // Store the log entry ID for later update
                setTeaserLogId(logData[0].id);
                console.log("Teaser log created with ID:", logData[0].id);
              }
            }
          }
        } catch (err) {
          console.log("Error checking UUID:", err);
          setIsValidUuid(false);
        } finally {
          setIsLoadingUuid(false);
        }
      }
    };

    checkLogic();
  }, [uuid, companyIdParam]);

  // =========================
  // RENDER LOGIC
  // =========================

  // ✅ If user is coming via connect link (uuid + company_id), show minimal loading while redirect happens
  if (uuid && companyIdParam) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        Loading...
      </div>
    );
  }

  // 1. Teaser Flow Loading
  if (uuid && !companyIdParam && isLoadingUuid) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        Loading...
      </div>
    );
  }

  // 2. Teaser Flow Valid - Show Product if showFullProduct is true
  if (uuid && !companyIdParam && isValidUuid) {
    if (showFullProduct) {
      return (
        <CartProvider companyId={companyId}>
          <HomePage />
        </CartProvider>
      );
    }
    return (
      <TeaserPreview
        companyId={companyId}
        pdfUrl={pdfUrl}
        onOpenFullReport={handleOpenFullReport}
      />
    );
  }

  // 3. Home page when company_id exists
  if (companyIdParam) {
    return (
      <CartProvider companyId={companyIdParam}>
        <HomePage />
      </CartProvider>
    );
  }

  // 4. No params at all
  if (!isLoadingUuid && !uuid && !companyIdParam) {
    return <Page404 />;
  }

  // 5. uuid present but invalid (teaser flow)
  if (uuid && !companyIdParam && !isLoadingUuid && !isValidUuid) {
    return <Page404 />;
  }

  return null;
}

export default function ProductPage() {
  return (
    <Suspense fallback={null}>
      <ProtectedHome />
    </Suspense>
  );
}
