import Stripe from 'stripe';

export async function POST(req) {
  try {
    const body = await req.json();
    const credits = Number(body?.credits);
    const organisationId = body?.organisationId || null;
    if (!Number.isFinite(credits) || credits <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid credits' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      console.error('Stripe secret not configured (STRIPE_SECRET_KEY missing)');
      return new Response(
        JSON.stringify({ error: 'Stripe secret not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

    const pricePerCreditGbp = 2; // £2 per credit
    const vatRate = 0.2;
    const totalGbp = credits * pricePerCreditGbp * (1 + vatRate);
    const amountPence = Math.round(totalGbp * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      metadata: {
        credits: String(credits),
        organisation_id: organisationId ? String(organisationId) : ''
      }
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Create PI error', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


