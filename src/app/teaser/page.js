"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/supabaseClient";
import Page404 from "@/components/newdesign/Page404";
import TeaserPreview from "@/components/TeaserPreview";
import { logEvent } from "@/utils/eventLogger";

function TeaserInner() {
  const searchParams = useSearchParams();
  const uuid = searchParams?.get("uuid");

  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    const checkUuid = async () => {
      if (!uuid) {
        setIsLoading(false);
        return;
      }
      try {
        const supabase = getSupabase();

        // Step 1: Get User's Organisation ID from people
        const { data: userData, error: userError } = await supabase
          .from("people")
          .select("organisation_id")
          .eq("id", uuid)
          .maybeSingle();

        if (userError || !userData || !userData.organisation_id) {
          console.log(
            "User not found in people or no organisation_id:",
            userError
          );
          setIsValid(false);
          setIsLoading(false);
          return;
        }

        const orgId = userData.organisation_id;

        // Step 1b: Get Company ID from organisations
        const { data: orgData, error: orgError } = await supabase
          .from("organisations")
          .select("company_id")
          .eq("id", orgId)
          .maybeSingle();

        if (orgError || !orgData || !orgData.company_id) {
          console.log("Organisation not found or no company_id:", orgError);
          setIsValid(false);
          setIsLoading(false);
          return;
        }

        const companyId = orgData.company_id;

        // Step 2: Check for Teaser document for this Company
        const { data: docData, error: docError } = await supabase
          .from("reports")
          .select("*")
          .eq("company_id", companyId)
          .eq("report_type", "teaser")
          .limit(1);

        if (docError) {
          console.log("Error checking documents:", docError);
          setIsValid(false);
        } else if (docData && docData.length > 0) {
          setIsValid(true);
          setCompanyId(companyId);
          setPdfUrl(docData[0].storage_path);

          setIsValid(true);
          setCompanyId(companyId);
          setPdfUrl(docData[0].storage_path);

          // Log Teaser view
          logEvent({
            eventType: "Teaser",
            companyId: companyId,
            userId: uuid
          });
        } else {
          setIsValid(false);
        }
      } catch (err) {
        console.log("Error in checkUuid:", err);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUuid();
  }, [uuid]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        Loading...
      </div>
    );
  }

  if (!isValid) {
    return <Page404 />;
  }

  return <TeaserPreview companyId={companyId} pdfUrl={pdfUrl} />;
}

export default function Teaser() {
  return (
    <Suspense fallback={null}>
      <TeaserInner />
    </Suspense>
  );
}
