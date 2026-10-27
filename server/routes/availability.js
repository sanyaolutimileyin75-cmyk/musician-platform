const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 1. ADD BLOCKED DATE (Musician Only)
router.post('/', authenticateToken, requireRole('musician'), async (req, res) => {
  const { unavailable_date, reason } = req.body;

  if (!unavailable_date) {
    return res.status(400).json({ message: 'Date is required.' });
  }

  try {
    const profileRes = await pool.query('SELECT id FROM musician_profiles WHERE user_id = $1', [req.user.id]);
    const profileId = profileRes.rows[0].id;

    const newBlocked = await pool.query(
      `INSERT INTO musician_unavailability (musician_profile_id, unavailable_date, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (musician_profile_id, unavailable_date) DO UPDATE SET reason = EXCLUDED.reason
       RETURNING *`,
      [profileId, unavailable_date, reason || null]
    );

    res.status(201).json({ message: 'Date marked as unavailable.', date: newBlocked.rows[0] });
  } catch (err) {
    console.error('Add Unavailability Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. GET MUSICIAN'S BLOCKED DATES
router.get('/:musician_profile_id', async (req, res) => {
  const { musician_profile_id } = req.params;

  try {
    const dates = await pool.query(
      'SELECT * FROM musician_unavailability WHERE musician_profile_id = $1 ORDER BY unavailable_date ASC',
      [musician_profile_id]
    );
    res.json({ unavailable_dates: dates.rows });
  } catch (err) {
    console.error('Get Unavailability Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. REMOVE BLOCKED DATE (Musician Only)
router.delete('/:id', authenticateToken, requireRole('musician'), async (req, res) => {
  const { id } = req.params;

  try {
    const profileRes = await pool.query('SELECT id FROM musician_profiles WHERE user_id = $1', [req.user.id]);
    const profileId = profileRes.rows[0].id;

    await pool.query('DELETE FROM musician_unavailability WHERE id = $1 AND musician_profile_id = $2', [id, profileId]);
    res.json({ message: 'Date removed from unavailable list.' });
  } catch (err) {
    console.error('Delete Unavailability Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
