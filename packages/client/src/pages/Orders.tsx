import { useState, useEffect } from 'react';
import { getOrders } from '../api';
import type { Order } from '../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  preparing: 'blue',
  ready: 'green',
  delivered: 'gray',
  cancelled: 'red',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrders()
      .then(data => { setOrders(data); setError(''); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="orders-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My Orders</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">&#128230;</span>
            <h2>No orders yet</h2>
            <p>Your order history will appear here once you place an order.</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <h3 className="order-id">Order #{order.id}</h3>
                  <div className="order-badges">
                    <span className={`badge badge-status badge-${STATUS_COLORS[order.status] || 'gray'}`}>
                      {order.status}
                    </span>
                    <span className="badge badge-type">
                      {order.order_type === 'dine-in' ? 'Dine In' : 'Delivery'}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items">
                    {order.items?.map((item, idx) => (
                      <span key={idx} className="order-item-tag">
                        {item.item_name || `Item #${item.menu_item_id}`} x{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="order-card-footer">
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="order-total">Rs. {order.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
