const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 1. POST A REVIEW (Client Only - Must be Completed booking)
router.post('/', authenticateToken, requireRole('client'), async (req, res) => {
  const { booking_id, rating, comment } = req.body;

  if (!booking_id || !rating) {
    return res.status(400).json({ message: 'Booking ID and rating (1-5) are required.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  try {
    // 1. Verify booking exists, belongs to this client, and is Completed
    const bookingRes = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND client_id = $2',
      [booking_id, req.user.id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or access denied.' });
    }

    const booking = bookingRes.rows[0];

    if (booking.status !== 'Completed') {
      return res.status(400).json({ message: 'You can only review completed bookings.' });
    }

    // 2. Check if already reviewed
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE booking_id = $1',
      [booking_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this booking.' });
    }

    // 3. Insert review
    const newReview = await pool.query(
      `INSERT INTO reviews (booking_id, client_id, musician_profile_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [booking_id, req.user.id, booking.musician_profile_id, rating, comment]
    );

    res.status(201).json({
      message: 'Review submitted successfully!',
      review: newReview.rows[0],
    });
  } catch (err) {
    console.error('Create Review Error:', err.message);
    res.status(500).json({ message: 'Server error during review submission.' });
  }
});

// 2. GET REVIEWS FOR A MUSICIAN (Public)
router.get('/musician/:musician_profile_id', async (req, res) => {
  const { musician_profile_id } = req.params;

  try {
    const reviewsRes = await pool.query(
      `SELECT 
        r.*,
        u.full_name AS client_name
       FROM reviews r
       JOIN users u ON r.client_id = u.id
       WHERE r.musician_profile_id = $1
       ORDER BY r.created_at DESC`,
      [musician_profile_id]
    );

    // Calculate Average Rating & Count
    const statsRes = await pool.query(
      `SELECT 
        COUNT(*)::int AS total_reviews,
        ROUND(AVG(rating), 1)::float AS average_rating
       FROM reviews
       WHERE musician_profile_id = $1`,
      [musician_profile_id]
    );

    res.json({
      stats: statsRes.rows[0],
      reviews: reviewsRes.rows,
    });
  } catch (err) {
    console.error('Get Musician Reviews Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;