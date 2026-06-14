import { Link, useLocation, Navigate } from 'react-router-dom';

interface BookingState {
  reservation: {
    id: number;
    table_number: number;
    date: string;
    time: string;
    guests: number;
    advance_paid: number;
  };
}

export default function BookingConfirmed() {
  const location = useLocation();
  const state = location.state as BookingState | null;

  if (!state?.reservation) {
    return <Navigate to="/booking" replace />;
  }

  const { reservation } = state;

  return (
    <div className="booking-confirmed-page">
      <div className="container">
        <div className="success-card">
          <div className="success-icon large">&#10003;</div>
          <h1 className="success-title">Booking Confirmed!</h1>
          <p className="success-subtitle">Your table has been reserved successfully</p>

          <div className="booking-details">
            <div className="booking-detail-row">
              <span className="booking-detail-label">Booking ID</span>
              <span className="booking-detail-value">#{reservation.id}</span>
            </div>
            <div className="booking-detail-row">
              <span className="booking-detail-label">Table</span>
              <span className="booking-detail-value">Table {reservation.table_number}</span>
            </div>
            <div className="booking-detail-row">
              <span className="booking-detail-label">Date</span>
              <span className="booking-detail-value">
                {new Date(reservation.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="booking-detail-row">
              <span className="booking-detail-label">Time</span>
              <span className="booking-detail-value">{reservation.time}</span>
            </div>
            <div className="booking-detail-row">
              <span className="booking-detail-label">Guests</span>
              <span className="booking-detail-value">{reservation.guests}</span>
            </div>
            <div className="booking-detail-row highlight">
              <span className="booking-detail-label">Amount Paid</span>
              <span className="booking-detail-value">Rs. {reservation.advance_paid}</span>
            </div>
          </div>

          <div className="success-actions">
            <Link to="/profile" className="btn btn-primary">View My Bookings</Link>
            <Link to="/" className="btn btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
