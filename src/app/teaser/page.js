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

        // Check for Teaser Document in teasers table using uuid as company_id
        console.log("Checking for teaser document for company_id (uuid):", uuid);
        const { data: teaserData, error: teaserError } = await supabase
          .from("teasers")
          .select("*")
          .eq("company_id", uuid)
          .eq("is_active", true)
          .maybeSingle();

        if (teaserError) {
          console.log("Supabase error fetching teaser:", teaserError);
          setIsValid(false);
        } else if (teaserData) {
          console.log("Teaser found:", teaserData.storage_path);
          setIsValid(true);
          setCompanyId(teaserData.company_id);
          setPdfUrl(teaserData.storage_path);

          // Log Teaser view
          logEvent({
            eventType: "Teaser",
            companyId: teaserData.company_id,
            userId: uuid
          });
        } else {
          console.log("No teaser found for this uuid/company_id");
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
