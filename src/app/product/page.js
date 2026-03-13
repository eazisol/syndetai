"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabase } from "@/supabaseClient";
import HomePage from "@/components/newdesign/HomePage";
import { CartProvider } from "@/components/newdesign/CartContext";
import Page404 from "@/components/newdesign/Page404";
import TeaserPreview from "@/components/TeaserPreview";
import { processConnectRedirect } from "@/utils/processConnectRedirect";
import { logEvent } from "@/utils/eventLogger";

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
        .from("event_log")
        .insert([
          {
            company_id: companyId,
            ip_address: ipAddress,
            event_type: "Landing",
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

          // 1. Verify UUID exists in people
          console.log("Checking UUID in people table:", uuid);
          const { data: userData, error: userError } = await supabase
            .from("people")
            .select("organisation_id")
            .eq("id", uuid)
            .maybeSingle();

          if (userError) {
            console.log("Supabase error fetching person:", userError);
            setIsValidUuid(false);
            setIsLoadingUuid(false);
            return;
          }

          if (!userData) {
            console.log("Verification failed: UUID not found in people table");
            setIsValidUuid(false);
            setIsLoadingUuid(false);
            return;
          }

          if (!userData.organisation_id) {
            console.log("Verification failed: person found but organisation_id is missing");
            setIsValidUuid(false);
            setIsLoadingUuid(false);
            return;
          }

          console.log("Found organisation_id:", userData.organisation_id);

          // 1b. Fetch company_id from organisations
          const { data: orgData, error: orgError } = await supabase
            .from("organisations")
            .select("company_id")
            .eq("id", userData.organisation_id)
            .maybeSingle();

          if (orgError) {
            console.log("Supabase error fetching organisation:", orgError);
            setIsValidUuid(false);
            setIsLoadingUuid(false);
            return;
          }

          if (!orgData) {
            console.log("Verification failed: organisation_id not found in organisations table");
            setIsValidUuid(false);
            setIsLoadingUuid(false);
            return;
          }

          if (!orgData.company_id) {
            console.log("Verification failed: organisation found but company_id is missing");
            setIsValidUuid(false);
            setIsLoadingUuid(false);
            return;
          }

          const userCompanyId = orgData.company_id;
          console.log("Successfully resolved company_id:", userCompanyId);

          // 2. Check for Teaser Document and get company_id from research_documents
          console.log("Checking for teaser report for company_id:", userCompanyId);
          const { data: docData, error: docError } = await supabase
            .from("reports")
            .select("*")
            .eq("company_id", userCompanyId)
            .eq("report_type", "teaser")
            .limit(1);

          if (docError) {
            console.log("Supabase error fetching report:", docError);
            setIsValidUuid(false);
          } else if (docData && docData.length > 0) {
            console.log("Teaser report found:", docData[0].storage_path);
            setIsValidUuid(true);
            setCompanyId(docData[0].company_id);
            setPdfUrl(docData[0].storage_path);

            // Log Teaser Activity (ONLY IF NOT LOGGED YET)
            if (!hasLoggedTeaser.current) {
              hasLoggedTeaser.current = true;

              logEvent({
                eventType: "Teaser",
                companyId: docData[0].company_id,
                userId: uuid
              });
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
        <CartProvider companyId={companyId} userId={uuid}>
          <HomePage />
        </CartProvider>
      );
    }
    return (
      <TeaserPreview
        companyId={companyId}
        pdfUrl={pdfUrl}
        onOpenFullReport={handleOpenFullReport}
        userId={uuid}
      />
    );
  }

  // 3. Home page when company_id exists
  if (companyIdParam) {
    return (
      <CartProvider companyId={companyIdParam} userId={uuid}>
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
