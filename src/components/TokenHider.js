
"use client";

import { useEffect } from "react";

export default function TokenHider() {
    useEffect(() => {
        // Check if the code is running in the browser
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.searchParams.has("access_token")) {
                // Remove the parameter
                url.searchParams.delete("access_token");
                // Update the URL without reloading the page
                window.history.replaceState({}, "", url.toString());
            }
        }
    }, []);

    return null;
}
