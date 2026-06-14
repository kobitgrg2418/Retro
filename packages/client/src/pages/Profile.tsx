import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, getReservations, cancelReservation, submitFeedback, getOrders } from '../api';
import StarRating from '../components/StarRating';
import type { Reservation, Order } from '../types';

export default function Profile() {
  const { user } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resLoading, setResLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [feedbackOrderId, setFeedbackOrderId] = useState<number | ''>('');
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [ambienceRating, setAmbienceRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackErr, setFeedbackErr] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    getReservations()
      .then(setReservations)
      .catch(() => {})
      .finally(() => setResLoading(false));
    getOrders()
      .then(setOrders)
      .catch(() => {});
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileErr('');
    setProfileMsg('');
    setProfileLoading(true);
    try {
      await updateProfile({ name, phone, address });
      setProfileMsg('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancelReservation = async (id: number) => {
    try {
      await cancelReservation(id);
      setReservations(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'cancelled' } : r))
      );
    } catch {
      // silent fail
    }
  };

  const handleFeedback = async (e: FormEvent) => {
    e.preventDefault();
    setFeedbackErr('');
    setFeedbackMsg('');
    if (!feedbackComment.trim()) {
      setFeedbackErr('Please write a comment');
      return;
    }
    setFeedbackLoading(true);
    try {
      await submitFeedback({
        order_id: feedbackOrderId ? Number(feedbackOrderId) : undefined,
        food_rating: foodRating,
        service_rating: serviceRating,
        ambience_rating: ambienceRating,
        comment: feedbackComment,
      });
      setFeedbackMsg('Thank you for your feedback!');
      setFeedbackComment('');
      setFoodRating(5);
      setServiceRating(5);
      setAmbienceRating(5);
      setFeedbackOrderId('');
    } catch (err) {
      setFeedbackErr(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
        </div>

        <div className="profile-layout">
          {/* Profile Info */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>Personal Information</h2>
              {!editing && (
                <button className="btn btn-sm btn-outline" onClick={() => setEditing(true)}>Edit</button>
              )}
            </div>

            {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
            {profileErr && <div className="alert alert-error">{profileErr}</div>}

            {editing ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-input form-textarea"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="profile-info-row">
                  <span className="profile-info-label">Name</span>
                  <span className="profile-info-value">{user.name}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Email</span>
                  <span className="profile-info-value">{user.email}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Phone</span>
                  <span className="profile-info-value">{user.phone || 'Not set'}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Address</span>
                  <span className="profile-info-value">{user.address || 'Not set'}</span>
                </div>
                <div className="profile-info-row">
                  <span className="profile-info-label">Member Since</span>
                  <span className="profile-info-value">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reservations */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>My Bookings</h2>
            </div>

            {resLoading ? (
              <div className="spinner"></div>
            ) : reservations.length === 0 ? (
              <p className="empty-text">No reservations yet.</p>
            ) : (
              <div className="reservations-list">
                {reservations.map(res => (
                  <div key={res.id} className="reservation-item">
                    <div className="reservation-info">
                      <span className="reservation-id">Booking #{res.id}</span>
                      <span>Table {res.table_number || res.table_id}</span>
                      <span>{new Date(res.date).toLocaleDateString()} at {res.time}</span>
                      <span>{res.guests} guest{res.guests > 1 ? 's' : ''}</span>
                    </div>
                    <div className="reservation-actions">
                      <span className={`badge badge-status badge-${
                        res.status === 'confirmed' ? 'green' : res.status === 'cancelled' ? 'red' : 'gray'
                      }`}>
                        {res.status}
                      </span>
                      {res.status === 'confirmed' && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCancelReservation(res.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>Submit Feedback</h2>
            </div>

            {feedbackMsg && <div className="alert alert-success">{feedbackMsg}</div>}
            {feedbackErr && <div className="alert alert-error">{feedbackErr}</div>}

            <form onSubmit={handleFeedback}>
              <div className="form-group">
                <label className="form-label">Order (Optional)</label>
                <select
                  className="form-input"
                  value={feedbackOrderId}
                  onChange={e => setFeedbackOrderId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select an order</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      Order #{o.id} - Rs. {o.total}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Food Rating</label>
                <StarRating rating={foodRating} onRate={setFoodRating} />
              </div>

              <div className="form-group">
                <label className="form-label">Service Rating</label>
                <StarRating rating={serviceRating} onRate={setServiceRating} />
              </div>

              <div className="form-group">
                <label className="form-label">Ambience Rating</label>
                <StarRating rating={ambienceRating} onRate={setAmbienceRating} />
              </div>

              <div className="form-group">
                <label className="form-label">Comment</label>
                <textarea
                  className="form-input form-textarea"
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={feedbackLoading}>
                {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
