import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return new Response("Missing Stripe secrets", { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.log("Webhook signature verification failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const credits = Number(pi.metadata?.credits || 0);
      const organisationId = pi.metadata?.organisation_id || null;

      if (organisationId && credits > 0) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { db: { schema: 'syndet' } }
        );

        // Fetch current credits for balance_after
        const { data: orgData } = await supabase
          .from("organisations")
          .select("credit_balance")
          .eq("id", organisationId)
          .maybeSingle();

        const currentCredits = orgData?.credit_balance || 0;

        const { error } = await supabase.from("credit_transactions").insert([
          {
            organisation_id: organisationId,
            transaction_type: "credit_purchase",
            amount: credits,
            balance_after: currentCredits + credits,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) console.log("Webhook insert error:", error);
      }
    }
  } catch (err) {
    console.log("Webhook handling error", err);
    return new Response("Webhook error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
