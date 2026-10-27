import { useState } from 'react';
import { apiFetch } from '../services/api.js';
import './BookingModal.css';

export default function BookingModal({ musician, onClose, onSuccess }) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Derived State: Auto-calculated directly on every render 
   const calculateTotalPrice = () => {
    if (!startTime || !endTime) return 0;
    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);
    let duration = endH - startH;
    if (duration <= 0) duration = 1; // 1 hour minimum

    // Fallback to 50 if musician hasn't set their hourly rate yet
    const rate = parseFloat(musician?.hourly_rate) || 50; 
    return duration * rate;
  };

  const totalPrice = calculateTotalPrice();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          musician_profile_id: musician.profile_id,
          event_name: eventName,
          event_date: eventDate,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          location,
          notes,
          total_price: totalPrice,
        }),
      });

      onSuccess(); // Triggers success message on directory page
    } catch (err) {
      setError(err.message); // Show backend conflict/validation error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Book {musician.full_name}</h2>
            <p>Rate: ${parseFloat(musician.hourly_rate).toFixed(0)} / hour</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {error && <div className="modal-alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="eventName">Event Name / Occasion</label>
            <input
              id="eventName"
              type="text"
              placeholder="e.g. Wedding Reception, Corporate Dinner"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="eventDate">Event Date</label>
            <input
              id="eventDate"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Event Location / Venue</label>
            <input
              id="location"
              type="text"
              placeholder="e.g. Victoria Island, Lagos"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes / Special Requests (Optional)</label>
            <textarea
              id="notes"
              placeholder="Song preferences, dress code, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="price-summary-box">
            <span>Estimated Total:</span>
            <strong>${totalPrice.toFixed(2)}</strong>
          </div>

          <button className="btn-submit-booking" type="submit" disabled={loading}>
            {loading ? 'Sending Request...' : 'Send Booking Request'}
          </button>
        </form>
      </div>
    </div>
  );
}