import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api';

export default function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<'dine-in' | 'delivery'>('dine-in');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  if (items.length === 0 && !success) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add some items before checking out.</p>
            <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setError('Please enter a delivery address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const order = await createOrder({
        items: items.map(i => ({
          menu_item_id: i.id,
          quantity: i.quantity,
        })),
        order_type: orderType,
        address: orderType === 'delivery' ? deliveryAddress : undefined,
      });
      setOrderId(order.id);
      clearCart();
      if (paymentMethod === 'online') {
        navigate('/payment', {
          state: { orderId: order.id, amount: order.total, method: 'online' },
        });
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">&#10003;</div>
            <h2>Order Placed Successfully!</h2>
            <p>Your order #{orderId} has been received.</p>
            <p>Payment method: Cash on {orderType === 'delivery' ? 'delivery' : 'pickup'}</p>
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
    <div className="checkout-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Checkout</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="checkout-layout">
          <div className="checkout-form">
            {/* Order Type */}
            <div className="checkout-section">
              <h3 className="checkout-section-title">Order Type</h3>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${orderType === 'dine-in' ? 'active' : ''}`}
                  onClick={() => setOrderType('dine-in')}
                >
                  Dine In
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${orderType === 'delivery' ? 'active' : ''}`}
                  onClick={() => setOrderType('delivery')}
                >
                  Home Delivery
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            {orderType === 'delivery' && (
              <div className="checkout-section">
                <h3 className="checkout-section-title">Delivery Address</h3>
                <div className="form-group">
                  <textarea
                    className="form-input form-textarea"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    rows={3}
                    required
                  />
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="checkout-section">
              <h3 className="checkout-section-title">Payment Method</h3>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  Cash
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${paymentMethod === 'online' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('online')}
                >
                  Online Payment
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="checkout-summary">
            <h3 className="cart-summary-title">Order Summary</h3>
            <div className="checkout-items">
              {items.map(item => (
                <div key={item.id} className="checkout-item">
                  <span className="checkout-item-name">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="checkout-item-price">Rs. {item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>Rs. {totalAmount}</span>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Placing Order...' : `Place Order - Rs. ${totalAmount}`}
            </button>

            <Link to="/cart" className="continue-shopping">&larr; Back to Cart</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
