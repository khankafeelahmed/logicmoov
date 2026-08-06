'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

export default function CheckoutForm({
  fareAmount,
  returnUrl,
}: {
  fareAmount: number;
  returnUrl: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
    // On success, Stripe redirects to return_url automatically
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        style={{ marginTop: '16px', padding: '10px 20px' }}
      >
        {isProcessing ? 'Processing...' : `Pay $${fareAmount.toFixed(2)}`}
      </button>
    </form>
  );
}