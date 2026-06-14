import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../api';
import type { DashboardStats, Order } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  preparing: 'blue',
  ready: 'green',
  delivered: 'gray',
  cancelled: 'red',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(data => { setStats(data); setError(''); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Dashboard</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-card-orders">
              <div className="stat-card-label">Total Orders</div>
              <div className="stat-card-value">{stats.stats.total_orders}</div>
            </div>
            <div className="stat-card stat-card-revenue">
              <div className="stat-card-label">Total Revenue</div>
              <div className="stat-card-value">Rs. {stats.stats.total_revenue.toLocaleString()}</div>
            </div>
            <div className="stat-card stat-card-reservations">
              <div className="stat-card-label">Total Reservations</div>
              <div className="stat-card-value">{stats.stats.total_reservations}</div>
            </div>
            <div className="stat-card stat-card-members">
              <div className="stat-card-label">Total Users</div>
              <div className="stat-card-value">{stats.stats.total_users}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <Link to="/admin/menu" className="btn btn-primary">Manage Menu</Link>
            <Link to="/admin/orders" className="btn btn-outline">View Orders</Link>
            <Link to="/admin/reservations" className="btn btn-outline">View Reservations</Link>
            <Link to="/admin/reports" className="btn btn-outline">View Reports</Link>
          </div>

          {/* Recent Orders Table */}
          <div className="admin-card">
            <h2 className="admin-card-title">Recent Orders</h2>
            {stats.recent_orders.length === 0 ? (
              <p className="empty-text">No recent orders.</p>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_orders.map((order: Order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.user_name || `User #${order.user_id}`}</td>
                        <td>Rs. {order.total}</td>
                        <td>
                          <span className={`badge badge-status badge-${STATUS_COLORS[order.status] || 'gray'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
