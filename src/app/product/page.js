"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, notFound } from "next/navigation";
import { getSupabase } from "@/supabaseClient";
import HomePage from "@/components/newdesign/HomePage";
import { CartProvider } from "@/components/newdesign/CartContext";
import Page404 from "@/components/newdesign/Page404";
import TeaserPreview from "@/components/TeaserPreview";

export default function ProtectedHome() {
    const searchParams = useSearchParams();
    const uuid = searchParams?.get("uuid");
    const companyIdParam = searchParams?.get("company_id");

    console.log("ProductPage: Mounted", { uuid, companyIdParam });

    // State for UUID/Teaser Flow
    const [isValidUuid, setIsValidUuid] = useState(false);
    const [isLoadingUuid, setIsLoadingUuid] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);

    useEffect(() => {
        const checkLogic = async () => {
            // Priority 1: Check UUID (Teaser Flow)
            if (uuid) {
                setIsLoadingUuid(true);
                try {
                    const supabase = getSupabase();

                    // 1. Get User's Company ID
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

                    const resolvedCompanyId = userData.company_id;

                    // 2. Check for Teaser Document
                    const { data: docData, error: docError } = await supabase
                        .from("research_documents")
                        .select("*")
                        .eq("company_id", resolvedCompanyId)
                        .eq("doc_type", "teaser")
                        .limit(1);

                    if (docError || !docData || docData.length === 0) {
                        setIsValidUuid(false);
                    } else {
                        setIsValidUuid(true);
                        setCompanyId(resolvedCompanyId);
                        setPdfUrl(docData[0].storage_path);
                    }
                } catch (err) {
                    console.error("Error checking UUID:", err);
                    setIsValidUuid(false);
                } finally {
                    setIsLoadingUuid(false);
                }
                return; // Exit if we processed UUID (either found or not)
            }
        };

        checkLogic();
    }, [uuid]);

    // RENDER LOGIC

    // 1. Teaser Flow Loading
    if (uuid && isLoadingUuid) {
        return <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>Loading...</div>;
    }

    // 2. Teaser Flow Valid
    if (uuid && isValidUuid) {
        return (
            <TeaserPreview companyId={companyId} pdfUrl={pdfUrl} />
            // <div className="app" style={{ flexDirection: 'column' }}>
            //     <div className="app-content" style={{ marginLeft: 0 }}>
            //         <div className="main-content-library" style={{ width: "100%", margin: 0, padding: "20px" }}>
            //             <LogsDetailed companyId={companyId} pdfUrl={pdfUrl} />
            //         </div>
            //     </div>
            // </div>
        );
    }

    // 3. Company ID Flow (Replaces Token Flow)
    if (companyIdParam) {
        return (
            <>
                <CartProvider>
                    <HomePage />

                </CartProvider>
            </>
        );
    }

    // 4. Default / Not Found
    // If we finished checking and matched nothing:
    if (!isLoadingUuid && !uuid && !companyIdParam) {
        // User entered /home logic (ProtectedHome) but provided no valid credentials/params.
        // Previous code used `notFound()`.
        // We can render Page404 or use notFound().
        // notFound() usually renders the closest not-found.js
        // Page404 is the component.
        // Let's use Page404 for consistency with Log flow.
        return <Page404 />;
    }

    // If uuid was present but invalid, render 404 (handled by condition 4 if checks finish)
    if (uuid && !isLoadingUuid && !isValidUuid) {
        return <Page404 />;
    }

    return null;
}
