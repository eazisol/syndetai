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

          // 1. Resolve to organisation_id from people table
          const { data: userData, error: userError } = await supabase
            .from("people")
            .select("organisation_id")
            .eq("id", uuid)
            .maybeSingle();

          if (userError || !userData || !userData.organisation_id) {
            setIsValidUuid(false);
            setIsLoadingUuid(false);
            return;
          }

          // 2. Resolve to company_id from organisations table
          const { data: orgData, error: orgError } = await supabase
            .from("organisations")
            .select("company_id")
            .eq("id", userData.organisation_id)
            .maybeSingle();

          if (orgError || !orgData || !orgData.company_id) {
            setIsValidUuid(false);
            setIsLoadingUuid(false);
            return;
          }

          const matchedCompanyId = orgData.company_id;

          // 3. Check for Teaser Document in teasers table using company_id
          console.log("Checking for teaser document for company_id:", matchedCompanyId);
          const { data: teaserData, error: teaserError } = await supabase
            .from("teasers")
            .select("*")
            .eq("company_id", matchedCompanyId)
            .eq("is_active", true)
            .maybeSingle();

          if (teaserError) {
            console.log("Supabase error fetching teaser:", teaserError);
            setIsValidUuid(false);
          } else if (teaserData) {
            console.log("Teaser found:", teaserData.storage_path);
            setIsValidUuid(true);
            setCompanyId(teaserData.company_id);
            setPdfUrl(teaserData.storage_path);

            // Log Teaser Activity (ONLY IF NOT LOGGED YET)
            if (!hasLoggedTeaser.current) {
              hasLoggedTeaser.current = true;

              logEvent({
                eventType: "Teaser",
                companyId: teaserData.company_id,
                userId: uuid
              });
            }
          } else {
            console.log("No teaser found for this uuid/company_id");
            setIsValidUuid(false);
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
        <CartProvider companyId={companyId} userId={uuid} persona="company">
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
