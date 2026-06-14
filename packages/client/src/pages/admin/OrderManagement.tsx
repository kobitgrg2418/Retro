import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../../api';
import type { Order } from '../../types';

const STATUS_OPTIONS = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  preparing: 'blue',
  ready: 'green',
  delivered: 'gray',
  cancelled: 'red',
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrders()
      .then(data => { setOrders(data); setError(''); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateOrderStatus(id, status);
      setOrders(prev =>
        prev.map(o => (o.id === id ? { ...o, status: status as Order['status'] } : o))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const filtered = filter === 'All'
    ? orders
    : orders.filter(o => o.status === filter);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Order Management</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter */}
      <div className="filter-bar">
        <button
          className={`category-tab ${filter === 'All' ? 'active' : ''}`}
          onClick={() => setFilter('All')}
        >
          All
        </button>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className={`category-tab ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {filtered.length === 0 ? (
          <p className="empty-text">No orders found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.user_name || `User #${order.user_id}`}</td>
                    <td>
                      <div className="order-items-cell">
                        {order.items?.map((item, i) => (
                          <span key={i} className="order-item-tag-sm">
                            {item.item_name || `#${item.menu_item_id}`} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>Rs. {order.total}</td>
                    <td>
                      <span className="badge badge-type">
                        {order.order_type === 'dine-in' ? 'Dine In' : 'Delivery'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status badge-${STATUS_COLORS[order.status] || 'gray'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <select
                        className="form-input form-input-sm"
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        disabled={order.status === 'delivered' || order.status === 'cancelled'}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
