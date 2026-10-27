import { useState } from 'react';
import { apiFetch } from '../services/api.js';
import './BookingModal.css'; // Reusing modal base styles
import './ReviewModal.css';

export default function ReviewModal({ booking, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: booking.id,
          rating,
          comment,
        }),
      });

      onSuccess(booking.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Review {booking.musician_name}</h2>
            <p className="review-modal-subtitle">How was their performance at {booking.event_name}?</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} type="button">✕</button>
        </div>

        {error && <div className="modal-alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* STAR RATING SELECTOR */}
          <div className="star-rating-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="comment">Your Feedback / Review</label>
            <textarea
              id="comment"
              placeholder="Share details about their punctuality, stage presence, and sound quality..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required
            />
          </div>

          <button className="btn-submit-booking" type="submit" disabled={loading}>
            {loading ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}