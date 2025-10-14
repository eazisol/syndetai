import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !webhookSecret) {
    return new Response('Missing Stripe secrets', { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return new Response('Bad signature', { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const credits = Number(pi.metadata?.credits || 0);
      const organisationId = pi.metadata?.organisation_id || null;

      if (organisationId && credits > 0) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabase
          .from('transactions')
          .insert([
            {
              organisation_id: organisationId,
              credits_added: credits,
              payment_provider: 'stripe',
              payment_intent: pi.id,
            },
          ]);
        if (error) {
          console.error('Webhook insert error:', error);
        }
      }
    }
  } catch (err) {
    console.error('Webhook handling error', err);
    return new Response('Webhook error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}

export const config = {
  api: {
    bodyParser: false,
  },
};


