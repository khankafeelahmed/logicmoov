'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const { locale } = useParams<{ locale: string }>();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [fareAmount, setFareAmount] = useState(25.5);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fareFromQuery = Number(params.get('fare'));
    if (Number.isFinite(fareFromQuery) && fareFromQuery > 0) {
      setFareAmount(fareFromQuery);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPaymentError(null);
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fareAmount }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Could not initialize payment.');
        }
        return data;
      })
      .then((data) => {
        if (!cancelled) setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        if (!cancelled) {
          setPaymentError(
            err instanceof Error ? err.message : 'Could not initialize payment.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fareAmount]);

  if (paymentError) return <p>{paymentError}</p>;
  if (!clientSecret) return <p>Loading payment form...</p>;

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto' }}>
      <h1>Complete your ride payment</h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm
          fareAmount={fareAmount}
          returnUrl={`${window.location.origin}/${locale}/payment-success`}
        />
      </Elements>
    </div>
  );
}