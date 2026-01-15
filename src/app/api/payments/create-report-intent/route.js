import Stripe from 'stripe';

export async function POST(req) {
    try {
        const body = await req.json();
        const totalAmount = body?.total ? Number(body.total) : null;
        const companyId = body?.companyId || null;

        if (!totalAmount || !Number.isFinite(totalAmount) || totalAmount <= 0) {
            return new Response(
                JSON.stringify({ error: 'Invalid amount' }),
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

        const amountPence = Math.round(totalAmount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountPence,
            currency: 'gbp',
            automatic_payment_methods: { enabled: true },
            metadata: {
                company_id: companyId ? String(companyId) : '',
                type: 'report_purchase'
            }
        });

        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('Create Report PI error', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
