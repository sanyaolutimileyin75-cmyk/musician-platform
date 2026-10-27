const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 1. CREATE A BOOKING (With Overlap & Unavailability Check)
router.post('/', authenticateToken, requireRole('client'), async (req, res) => {
  const { musician_profile_id, event_name, event_date, start_time, end_time, location, notes, total_price } = req.body;

  if (!musician_profile_id || !event_name || !event_date || !start_time || !end_time || !location || !total_price) {
    return res.status(400).json({ message: 'All required booking fields must be provided.' });
  }

  try {
    // 1. Check if musician exists
    const musicianCheck = await pool.query('SELECT id FROM musician_profiles WHERE id = $1', [musician_profile_id]);
    if (musicianCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Musician profile not found.' });
    }

    // 2. Check if musician blocked this entire date
    const blockedCheck = await pool.query(
      'SELECT * FROM musician_unavailability WHERE musician_profile_id = $1 AND unavailable_date = $2',
      [musician_profile_id, event_date]
    );

    if (blockedCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: `Musician is unavailable on ${event_date}${blockedCheck.rows[0].reason ? `: ${blockedCheck.rows[0].reason}` : ''}.` 
      });
    }

    // 3. Check for overlapping Accepted or Pending bookings
    const overlapCheck = await pool.query(
      `SELECT * FROM bookings 
       WHERE musician_profile_id = $1 
         AND event_date = $2 
         AND status IN ('Pending', 'Accepted')
         AND (start_time < $4 AND end_time > $3)`,
      [musician_profile_id, event_date, start_time, end_time]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Musician already has a booking request or event during this time slot.' 
      });
    }

    // 4. Create booking if no conflicts
    const newBooking = await pool.query(
      `INSERT INTO bookings 
        (client_id, musician_profile_id, event_name, event_date, start_time, end_time, location, notes, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, musician_profile_id, event_name, event_date, start_time, end_time, location, notes, total_price]
    );

    res.status(201).json({
      message: 'Booking request sent successfully!',
      booking: newBooking.rows[0],
    });
  } catch (err) {
    console.error('Create Booking Error:', err.message);
    res.status(500).json({ message: 'Server error during booking creation.' });
  }
});

// 2. GET CLIENT'S BOOKINGS (Client Only)
router.get('/client', authenticateToken, requireRole('client'), async (req, res) => {
  try {
    const query = `
      SELECT 
        b.*,
        u.full_name AS musician_name,
        mp.profile_picture_url
      FROM bookings b
      JOIN musician_profiles mp ON b.musician_profile_id = mp.id
      JOIN users u ON mp.user_id = u.id
      WHERE b.client_id = $1
      ORDER BY b.event_date DESC, b.start_time DESC
    `;

    const result = await pool.query(query, [req.user.id]);
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Get Client Bookings Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. GET MUSICIAN'S BOOKINGS (Musician Only)
router.get('/musician', authenticateToken, requireRole('musician'), async (req, res) => {
  try {
    const query = `
      SELECT 
        b.*,
        u.full_name AS client_name,
        u.email AS client_email
      FROM bookings b
      JOIN users u ON b.client_id = u.id
      JOIN musician_profiles mp ON b.musician_profile_id = mp.id
      WHERE mp.user_id = $1
      ORDER BY b.event_date DESC, b.start_time DESC
    `;

    const result = await pool.query(query, [req.user.id]);
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Get Musician Bookings Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. UPDATE BOOKING STATUS (Accepted, Rejected, Cancelled, Completed)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['Accepted', 'Rejected', 'Cancelled', 'Completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status update.' });
  }

  try {
    // Fetch existing booking
    const bookingRes = await pool.query(
      `SELECT b.*, mp.user_id AS musician_user_id 
       FROM bookings b
       JOIN musician_profiles mp ON b.musician_profile_id = mp.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];

    // Authorization checks:
    // - Musician can Accept, Reject, or Complete
    // - Client can Cancel
    if (['Accepted', 'Rejected', 'Completed'].includes(status) && req.user.id !== booking.musician_user_id) {
      return res.status(403).json({ message: 'Only the musician can update status to Accepted, Rejected, or Completed.' });
    }

    if (status === 'Cancelled' && req.user.id !== booking.client_id) {
      return res.status(403).json({ message: 'Only the client can cancel this booking.' });
    }

    const updatedBooking = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({
      message: `Booking status updated to ${status}.`,
      booking: updatedBooking.rows[0],
    });
  } catch (err) {
    console.error('Update Status Error:', err.message);
    res.status(500).json({ message: 'Server error during status update.' });
  }
});

module.exports = router;