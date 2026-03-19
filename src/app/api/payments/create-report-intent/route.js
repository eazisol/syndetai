import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const totalAmount = body?.total ? Number(body.total) : null;
    const companyId = body?.companyId || null;
    const email = body?.email || null;

    if (!totalAmount || !Number.isFinite(totalAmount) || totalAmount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
      console.log("Missing env configuration");
      return new Response(JSON.stringify({ error: "Missing configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const amountPence = Math.round(totalAmount * 100);

    console.log("Create-report-intent payload", {
      companyId,
      email,
      totalAmount,
      stripeSecretExists: !!stripeSecret,
      supabaseUrlExists: !!supabaseUrl,
      supabaseServiceKeyExists: !!supabaseServiceKey,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: {
        company_id: companyId ? String(companyId) : "",
        email: email || "",
        type: "report_purchase",
      },
    });

    console.log("Stripe paymentIntent created", {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
    });

    const { data: testData, error: testErr } = await supabaseAdmin
      .schema("syndet")
      .from("purchases")
      .select("id")
      .limit(1);
    console.log("purchase table test select", { testData, testErr });

    const { data: insertedRow, error: insertError } = await supabaseAdmin
      .schema("syndet")
      .from("purchases")
      .insert([
        {
          organisation_id: body.organisation_id || '05f85616-d438-4d86-a46c-84869c6e6e04',
          purchase_type: body.purchase_type || "product",
          pricing_model: body.pricing_model || "one_off",
          amount_gbp: totalAmount,
          vat_amount_gbp: body.vatAmount ? Number(body.vatAmount) : 0,
          total_amount_gbp: totalAmount,
          currency: body.currency || "GBP",
        //   payment_ref: paymentIntent.id,
          payment_status: body.payment_status || "pending",
          metadata: {
            email: email || null,
          },
        },
      ])
      .select();

    if (insertError) {
      console.log("Purchase insert error", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create purchase row" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.log("Create Report PI error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
