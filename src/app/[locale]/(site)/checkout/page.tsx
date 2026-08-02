'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const fareAmount = 25.5; // TODO: replace with actual fare passed from your ride flow

  useEffect(() => {
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fareAmount }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  if (!clientSecret) return <p>Loading payment form...</p>;

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto' }}>
      <h1>Complete your ride payment</h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm fareAmount={fareAmount} />
      </Elements>
    </div>
  );
}