import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.js';
import { apiFetch } from '../services/api.js';
import ReviewModal from '../components/ReviewModal';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [reviewsData, setReviewsData] = useState({ stats: null, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);

  const isMusician = user?.role === 'musician';

  // 1. Fetch Bookings and Reviews cleanly
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const endpoint = user.role === 'musician' ? '/bookings/musician' : '/bookings/client';
        const data = await apiFetch(endpoint);

        if (isMounted) {
          setBookings(data.bookings);
        }

        // If user is a musician, also load their profile and reviews
        if (user.role === 'musician') {
          const profileData = await apiFetch('/musicians/me');
          if (profileData.profile?.profile_id) {
            const reviewsRes = await apiFetch(`/reviews/musician/${profileData.profile.profile_id}`);
            if (isMounted) {
              setReviewsData(reviewsRes);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Handle Status Update with Instant Local UI Update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await apiFetch(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p>Loading dashboard details...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>{isMusician ? 'Musician Gig Dashboard' : 'My Event Bookings'}</h1>
          <p>
            {isMusician
              ? 'Manage incoming booking requests and view performance reviews'
              : 'Track status of musicians you have requested for your events'}
          </p>
        </div>
      </div>

      {/* REVIEW MODAL POPUP (Client Only) */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={(bookingId) => {
            setReviewedBookingIds((prev) => [...prev, bookingId]);
            setReviewBooking(null);
            alert('Thank you! Your review has been published.');
          }}
        />
      )}

      {error && <div className="status-alert error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* BOOKINGS SECTION */}
      {bookings.length === 0 ? (
        <div className="no-results" style={{ marginBottom: '2rem' }}>
          <h3>No bookings found</h3>
          <p>{isMusician ? 'You have not received any gig requests yet.' : 'You have not booked any musicians yet.'}</p>
        </div>
      ) : (
        <div className="bookings-list" style={{ marginBottom: '3rem' }}>
          {bookings.map((b) => (
            <div key={b.id} className="booking-card">
              <div className="booking-card-top">
                <div>
                  <h2 className="event-title">{b.event_name}</h2>
                  <p className="party-name">
                    {isMusician ? `Client: ${b.client_name} (${b.client_email})` : `Musician: ${b.musician_name}`}
                  </p>
                </div>
                <span className={`status-badge ${b.status}`}>{b.status}</span>
              </div>

              <div className="booking-details-grid">
                <div className="detail-item">
                  <strong>Event Date</strong>
                  <span>{new Date(b.event_date).toLocaleDateString()}</span>
                </div>

                <div className="detail-item">
                  <strong>Time Slot</strong>
                  <span>{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</span>
                </div>

                <div className="detail-item">
                  <strong>Location</strong>
                  <span>📍 {b.location}</span>
                </div>

                <div className="detail-item">
                  <strong>Total Price</strong>
                  <span style={{ color: '#4f46e5', fontWeight: '700' }}>
                    ${parseFloat(b.total_price).toFixed(2)}
                  </span>
                </div>
              </div>

              {b.notes && (
                <div className="booking-notes">
                  <strong>Notes:</strong> {b.notes}
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="booking-actions">
                {isMusician && b.status === 'Pending' && (
                  <>
                    <button className="btn-action btn-accept" onClick={() => handleStatusUpdate(b.id, 'Accepted')}>
                      Accept Request
                    </button>
                    <button className="btn-action btn-reject" onClick={() => handleStatusUpdate(b.id, 'Rejected')}>
                      Reject
                    </button>
                  </>
                )}

                {isMusician && b.status === 'Accepted' && (
                  <button className="btn-action btn-complete" onClick={() => handleStatusUpdate(b.id, 'Completed')}>
                    Mark Event as Completed
                  </button>
                )}

                {!isMusician && b.status === 'Pending' && (
                  <button className="btn-action btn-cancel" onClick={() => handleStatusUpdate(b.id, 'Cancelled')}>
                    Cancel Booking Request
                  </button>
                )}

                {!isMusician && b.status === 'Completed' && (
                  reviewedBookingIds.includes(b.id) ? (
                    <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.9rem' }}>✓ Reviewed</span>
                  ) : (
                    <button className="btn-action btn-complete" onClick={() => setReviewBooking(b)}>
                      Leave a Review ★
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MUSICIAN REVIEWS SECTION (Visible to Musicians) */}
      {isMusician && (
        <div style={{ marginTop: '2rem', borderTop: '2px solid #e2e8f0', paddingTop: '2rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Client Reviews & Feedback</h2>
            {reviewsData.stats && (
              <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: '700', padding: '0.4rem 0.8rem', borderRadius: '12px' }}>
                ★ {reviewsData.stats.average_rating || '0.0'} ({reviewsData.stats.total_reviews} reviews)
              </span>
            )}
          </div>

          {reviewsData.reviews.length === 0 ? (
            <div className="no-results">
              <p>No reviews received yet. Reviews appear here once clients rate completed events.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviewsData.reviews.map((r) => (
                <div key={r.id} className="booking-card" style={{ background: '#f8fafc' }}>
                  <div className="booking-card-top">
                    <div>
                      <strong style={{ color: '#0f172a' }}>{r.client_name}</strong>
                      <span style={{ color: '#f59e0b', marginLeft: '0.75rem', fontWeight: '700' }}>
                        {'★'.repeat(r.rating)}
                      </span>
                    </div>
                    <small style={{ color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString()}</small>
                  </div>
                  <p style={{ color: '#334155', fontStyle: 'italic', marginTop: '0.5rem' }}>"{r.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}