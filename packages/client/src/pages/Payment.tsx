import { useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { createPayment } from '../api';

interface PaymentState {
  orderId: number;
  amount: number;
  method: 'cash' | 'online';
}

export default function Payment() {
  const location = useLocation();
  const state = location.state as PaymentState | null;

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!state) {
    return <Navigate to="/" replace />;
  }

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      await createPayment({
        order_id: state.orderId,
        amount: state.amount,
        method: 'online',
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">&#10003;</div>
            <h2>Payment Successful!</h2>
            <p>Rs. {state.amount} has been paid for Order #{state.orderId}</p>
            <div className="success-actions">
              <Link to="/orders" className="btn btn-primary">View My Orders</Link>
              <Link to="/" className="btn btn-outline">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Payment</h1>
        </div>

        <div className="payment-card">
          <div className="payment-amount">
            <span className="payment-label">Amount Due</span>
            <span className="payment-value">Rs. {state.amount}</span>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="payment-form">
            <h3 className="payment-form-title">Card Details</h3>
            <p className="payment-form-subtitle">This is a simulated payment form</p>

            <div className="form-group">
              <label htmlFor="cardNumber" className="form-label">Card Number</label>
              <input
                id="cardNumber"
                type="text"
                className="form-input"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiry" className="form-label">Expiry Date</label>
                <input
                  id="expiry"
                  type="text"
                  className="form-input"
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cvv" className="form-label">CVV</label>
                <input
                  id="cvv"
                  type="text"
                  className="form-input"
                  value={cvv}
                  onChange={e => setCvv(e.target.value)}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay Rs. ${state.amount}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
