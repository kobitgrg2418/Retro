import { useState, useEffect } from 'react';
import { getReservations, updateReservation } from '../../api';
import type { Reservation } from '../../types';

const STATUS_FILTERS = ['All', 'confirmed', 'cancelled', 'completed'];

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getReservations()
      .then(data => { setReservations(data); setError(''); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (id: number, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await updateReservation(id, { status });
      setReservations(prev =>
        prev.map(r => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const filtered = filter === 'All'
    ? reservations
    : reservations.filter(r => r.status === filter);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Reservations</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter */}
      <div className="filter-bar">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            className={`category-tab ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-card">
        {filtered.length === 0 ? (
          <p className="empty-text">No reservations found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Table</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(res => (
                  <tr key={res.id}>
                    <td>#{res.id}</td>
                    <td>{res.user_name || `User #${res.user_id}`}</td>
                    <td>Table {res.table_number || res.table_id}</td>
                    <td>{new Date(res.date).toLocaleDateString()}</td>
                    <td>{res.time}</td>
                    <td>{res.guests}</td>
                    <td>
                      <span className={`badge badge-status badge-${
                        res.status === 'confirmed' ? 'green'
                        : res.status === 'cancelled' ? 'red'
                        : 'gray'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {res.status === 'confirmed' && (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleUpdateStatus(res.id, 'completed')}
                            >
                              Complete
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleUpdateStatus(res.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {res.status === 'cancelled' && (
                          <span className="text-muted">Cancelled</span>
                        )}
                        {res.status === 'completed' && (
                          <span className="text-muted">Done</span>
                        )}
                      </div>
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
