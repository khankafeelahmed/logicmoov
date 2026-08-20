import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  if (!stripeSecretKey) {
    return errorResponse("Stripe is not configured on the server.", 500);
  }

  try {
    const body = (await req.json()) as { fareAmount?: number };
    const fareAmount = Number(body.fareAmount);
    if (!Number.isFinite(fareAmount) || fareAmount <= 0) {
      return errorResponse("Invalid fare amount.");
    }

    const stripe = new Stripe(stripeSecretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(fareAmount * 100),
      currency: "cad",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch {
    return errorResponse("Could not create payment intent.", 500);
  }
}