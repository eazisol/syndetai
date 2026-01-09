"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/supabaseClient"; 
import Page404 from "@/components/newdesign/Page404";
import TeaserPreview from "@/components/TeaserPreview";

export default function Teaser() {
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

        // Step 1: Get User's Company ID from company_people
        // The uuid in params is the User ID (company_people.id)
        const { data: userData, error: userError } = await supabase
          .from("company_people")
          .select("company_id")
          .eq("id", uuid)
          .maybeSingle(); // check safely

        if (userError || !userData || !userData.company_id) {
          console.error("User not found in company_people or no company_id:", userError);
          setIsValid(false);
          setIsLoading(false);
          return;
        }

        const companyId = userData.company_id;

        // Step 2: Check for Teaser document for this Company
        const { data: docData, error: docError } = await supabase
          .from("research_documents")
          .select("*")
          .eq("company_id", companyId)
          .eq("doc_type", "teaser")
          .limit(1);

        if (docError) {
          console.error("Error checking documents:", docError);
          setIsValid(false);
        } else if (docData && docData.length > 0) {
          // Teaser found -> Valid
          setIsValid(true);
          setCompanyId(companyId);
          setPdfUrl(docData[0].storage_path);
        } else {
          setIsValid(false);
        }

      } catch (err) {
        console.error("Error in checkUuid:", err);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUuid();
  }, [uuid]);

  if (isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>Loading...</div>;
  }

  if (!isValid) {
    return <Page404 />;
  }

  return (
    <TeaserPreview companyId={companyId} pdfUrl={pdfUrl} />
    // <div className="app">
    //   <MobileHeader />
    //   <div className="app-content">
    //     <div className="desktop-sidebar">
    //       <Sidebar />
    //     </div>
    //     <div className="main-content-library" >
    //       <LogsDetailed companyId={companyId} pdfUrl={pdfUrl} />
    //     </div>
    //   </div>
    // </div>
  );
}


