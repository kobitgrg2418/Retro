import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableTables, createReservation, createPayment } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Table } from '../types';

const ADVANCE_PAYMENT = 1200;

export default function Booking() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleCheckAvailability = async () => {
    if (!date || !time) {
      setError('Please select both date and time');
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/booking' } } });
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await getAvailableTables(date, time, guests);
      setTables(result);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setStep(3);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTable) return;
    setError('');
    setLoading(true);
    try {
      const reservation = await createReservation({
        table_id: selectedTable.id,
        date,
        time,
        guests,
      });
      await createPayment({
        reservation_id: reservation.id,
        amount: ADVANCE_PAYMENT,
        method: 'online',
      });
      navigate('/booking-confirmed', {
        state: {
          reservation: {
            ...reservation,
            table_number: selectedTable.table_number,
            advance_paid: ADVANCE_PAYMENT,
          },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Reserve a Table</h1>
          <p className="page-subtitle">Book your dining experience at Gokyo Bistro</p>
        </div>

        {/* Progress Steps */}
        <div className="booking-steps">
          <div className={`booking-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Date & Time</span>
          </div>
          <div className={`booking-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Select Table</span>
          </div>
          <div className={`booking-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Confirm</span>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="booking-form-card">
            <h2 className="booking-form-title">Select Date, Time & Guests</h2>
            <div className="booking-form-grid">
              <div className="form-group">
                <label htmlFor="date" className="form-label">Date</label>
                <input
                  id="date"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={today}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="time" className="form-label">Time</label>
                <input
                  id="time"
                  type="time"
                  className="form-input"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="guests" className="form-label">Number of Guests</label>
                <select
                  id="guests"
                  className="form-input"
                  value={guests}
                  onChange={e => setGuests(Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCheckAvailability}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Availability'}
            </button>
          </div>
        )}

        {/* Step 2: Select Table */}
        {step === 2 && (
          <div className="booking-form-card">
            <h2 className="booking-form-title">Available Tables</h2>
            <p className="booking-form-subtitle">
              {date} at {time} for {guests} guest{guests > 1 ? 's' : ''}
            </p>
            {tables.length === 0 ? (
              <div className="empty-state">
                <p>No tables available for your selection. Please try a different date or time.</p>
                <button className="btn btn-outline" onClick={() => setStep(1)}>Go Back</button>
              </div>
            ) : (
              <>
                <div className="tables-grid">
                  {tables.map(table => (
                    <div
                      key={table.id}
                      className={`table-card ${selectedTable?.id === table.id ? 'selected' : ''}`}
                      onClick={() => handleSelectTable(table)}
                    >
                      <div className="table-number">Table {table.table_number}</div>
                      <div className="table-capacity">Seats {table.capacity}</div>
                      <span className={`badge badge-location badge-${table.location}`}>
                        {table.location}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-outline" onClick={() => setStep(1)}>
                  &larr; Change Date/Time
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedTable && (
          <div className="booking-form-card">
            <h2 className="booking-form-title">Confirm Your Reservation</h2>
            <div className="booking-summary">
              <div className="booking-summary-row">
                <span>Table</span>
                <span>Table {selectedTable.table_number} ({selectedTable.location})</span>
              </div>
              <div className="booking-summary-row">
                <span>Date</span>
                <span>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="booking-summary-row">
                <span>Time</span>
                <span>{time}</span>
              </div>
              <div className="booking-summary-row">
                <span>Guests</span>
                <span>{guests}</span>
              </div>
              <div className="booking-summary-row booking-summary-total">
                <span>Advance Payment</span>
                <span>Rs. {ADVANCE_PAYMENT}</span>
              </div>
            </div>

            <div className="booking-confirm-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleConfirmBooking}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Confirm & Pay Rs. ${ADVANCE_PAYMENT}`}
              </button>
              <button className="btn btn-outline" onClick={() => setStep(2)}>
                &larr; Change Table
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
