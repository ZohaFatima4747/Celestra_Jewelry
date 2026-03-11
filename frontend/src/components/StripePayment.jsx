import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./StripePayment.css";

const StripePayment = ({ amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return alert("Stripe not loaded yet");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return alert("Card details not entered");

    setLoading(true);

    try {
      // 1️⃣ Get clientSecret from backend
      const res = await fetch("http://localhost:1000/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const { clientSecret } = await res.json();

      // 2️⃣ Confirm Stripe payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        alert(result.error.message);
      } else if (result.paymentIntent?.status === "succeeded") {
        onSuccess(result.paymentIntent.id);
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="stripe-payment-container">
      <h3>Card Payment</h3>
      <div className="card-element-wrapper">
        <CardElement options={{ hidePostalCode: true }} />
       
      </div>
      <button className="pay-btn" onClick={handlePay} disabled={loading}>
        {loading ? "Processing..." : `Pay Rs ${amount}`}
      </button>
    </div>
  );
};

export default StripePayment;
