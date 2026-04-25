// src/components/PaymentForm.js
import React, { useState } from 'react';
import { useElements, useStripe, CardElement } from '@stripe/react-stripe-js';
import { createPaymentIntent } from '../services/api';

export default function PaymentForm({ amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handlePay(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { client_secret } = await createPaymentIntent({ amount }); // amount in cents
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) {
        alert(result.error.message);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        onSuccess(result.paymentIntent);
      }
    } catch (err) {
      console.error(err);
      alert('Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay}>
      <CardElement />
      <button type="submit" disabled={loading || !stripe}>Pay ${ (amount/100).toFixed(2) }</button>
    </form>
  );
}