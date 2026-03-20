import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Bypass emails removed per request.
// Previously allowed bypass addresses:
// "ayesha654.rida@gmail.com"
// "stepridaayesha@gmail.com"
// "yolapac742@isfew.com"
const BYPASS_EMAILS = []; // no bypass emails

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: "Missing Supabase configuration" }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { email, origin } = await req.json();

    if (!email) {
      return jsonResponse({ error: "Email is required" }, 400);
    }

    if (!BYPASS_EMAILS.includes(email.toLowerCase())) {
      return jsonResponse({ error: "Email not authorized for bypass" }, 403);
    }

    // Determine the redirect origin
    const redirectOrigin = origin || new URL(req.url).origin;
    console.log("DEBUG: redirectOrigin is:", redirectOrigin);

    // Generate magic link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
          redirectTo: `${redirectOrigin}/library`
      }
    });

    if (error) {
      console.error("Error generating magic link:", error);
      return jsonResponse({ error: "Failed to generate login link" }, 500);
    }

    const actionLink = data.properties?.action_link;
    if (!actionLink) {
        return jsonResponse({ error: "No action link generated" }, 500);
    }

    console.log("DEBUG: Generated actionLink, attempting server-side consumption...");

    try {
        // Attempt to consume the link on the server to get the tokens
        // We use redirect: 'manual' to catch the 302 redirect
        const response = await fetch(actionLink, { 
            method: 'GET',
            redirect: 'manual' 
        });
        
        const location = response.headers.get('location');
        console.log("DEBUG: Response status:", response.status, "Location:", location);

        if (location && (location.includes('access_token=') || location.includes('#access_token='))) {
            // Extract tokens from the hash/query
            const hashPart = location.split('#')[1] || location.split('?')[1];
            const params = new URLSearchParams(hashPart);
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
                console.log("DEBUG: Successfully extracted tokens on server!");
                return jsonResponse({ 
                    success: true, 
                    tokens: {
                        access_token: accessToken,
                        refresh_token: refreshToken
                    }
                });
            }
        }
    } catch (consumeError) {
        console.error("Error consuming link on server:", consumeError);
        // Fall back to returning the action_link if server-side consumption fails
    }

    console.log("DEBUG: Falling back to client-side redirect with action_link");
    return jsonResponse({ 
      success: true, 
      action_link: actionLink 
    });

  } catch (error) {
    console.error("Auth bypass error:", error);
    return jsonResponse({ error: error.message || "Something went wrong" }, 500);
  }
}
