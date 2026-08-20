import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { fareAmount } = await req.json();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(fareAmount * 100),
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}