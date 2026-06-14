import { useState, useEffect } from 'react';
import { getReports, getFeedback } from '../../api';
import type { ReportData, Feedback } from '../../types';

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getReports(),
      getFeedback().catch(() => []),
    ])
      .then(([reportData, fb]) => {
        setData(reportData);
        setFeedbackList(fb);
        setError('');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  const maxRevenue = data?.revenue_by_day.reduce((max, d) => Math.max(max, d.revenue), 0) || 1;

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Reports & Analytics</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <div className="reports-layout">
          {/* Revenue Chart */}
          <div className="admin-card">
            <h2 className="admin-card-title">Daily Revenue (Last 30 Days)</h2>
            {data.revenue_by_day.length === 0 ? (
              <p className="empty-text">No revenue data available.</p>
            ) : (
              <div className="bar-chart">
                {data.revenue_by_day.slice(0, 7).map((day, idx) => (
                  <div key={idx} className="bar-chart-row">
                    <span className="bar-chart-label">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="bar-chart-track">
                      <div
                        className="bar-chart-fill"
                        style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                      ></div>
                    </div>
                    <span className="bar-chart-value">Rs. {day.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Items */}
          <div className="admin-card">
            <h2 className="admin-card-title">Popular Items (Top 10)</h2>
            {data.popular_items.length === 0 ? (
              <p className="empty-text">No data available.</p>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Total Ordered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.popular_items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>
                          <span className="badge badge-blue">{item.total_ordered}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Feedback */}
          <div className="admin-card">
            <h2 className="admin-card-title">Recent Feedback</h2>
            {feedbackList.length === 0 ? (
              <p className="empty-text">No feedback yet.</p>
            ) : (
              <div className="feedback-list">
                {feedbackList.map(fb => (
                  <div key={fb.id} className="feedback-item">
                    <div className="feedback-header">
                      <span className="feedback-author">{fb.user_name || `User #${fb.user_id}`}</span>
                      <span className="feedback-ratings">
                        Food: {fb.food_rating}/5 | Service: {fb.service_rating}/5 | Ambience: {fb.ambience_rating}/5
                      </span>
                    </div>
                    {fb.comment && <p className="feedback-comment">{fb.comment}</p>}
                    <span className="feedback-date">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
