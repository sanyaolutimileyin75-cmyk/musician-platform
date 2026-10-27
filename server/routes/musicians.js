const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 1. GET ALL INSTRUMENTS & GENRES (Public - for dropdowns/filters)
router.get('/meta', async (req, res) => {
  try {
    const instruments = await pool.query('SELECT * FROM instruments ORDER BY name ASC');
    const genres = await pool.query('SELECT * FROM genres ORDER BY name ASC');

    res.json({
      instruments: instruments.rows,
      genres: genres.rows,
    });
  } catch (err) {
    console.error('Meta Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. GET CURRENT MUSICIAN'S PROFILE (Protected - Musician only)
router.get('/me', authenticateToken, requireRole('musician'), async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id AS user_id,
        u.full_name,
        u.email,
        mp.id AS profile_id,
        mp.bio,
        mp.location,
        mp.hourly_rate,
        mp.profile_picture_url,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', i.id, 'name', i.name)) 
          FILTER (WHERE i.id IS NOT NULL), '[]'
        ) AS instruments,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', g.id, 'name', g.name)) 
          FILTER (WHERE g.id IS NOT NULL), '[]'
        ) AS genres
      FROM users u
      JOIN musician_profiles mp ON u.id = mp.user_id
      LEFT JOIN musician_instruments mi ON mp.id = mi.musician_profile_id
      LEFT JOIN instruments i ON mi.instrument_id = i.id
      LEFT JOIN musician_genres mg ON mp.id = mg.musician_profile_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      WHERE u.id = $1
      GROUP BY u.id, mp.id;
    `;

    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Musician profile not found.' });
    }

    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Get Profile Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. UPDATE MUSICIAN PROFILE (Protected - Musician only)
router.put('/me', authenticateToken, requireRole('musician'), async (req, res) => {
  const { bio, location, hourly_rate, instrument_ids, genre_ids } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start transaction

    // Get musician_profile id for this user
    const profileRes = await client.query(
      'SELECT id FROM musician_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const profileId = profileRes.rows[0].id;

    // Update basic profile info
    await client.query(
      `UPDATE musician_profiles 
       SET bio = COALESCE($1, bio),
           location = COALESCE($2, location),
           hourly_rate = COALESCE($3, hourly_rate)
       WHERE id = $4`,
      [bio, location, hourly_rate, profileId]
    );

    // Update Instruments if array provided
    if (Array.isArray(instrument_ids)) {
      await client.query('DELETE FROM musician_instruments WHERE musician_profile_id = $1', [profileId]);
      for (const instId of instrument_ids) {
        await client.query(
          'INSERT INTO musician_instruments (musician_profile_id, instrument_id) VALUES ($1, $2)',
          [profileId, instId]
        );
      }
    }

    // Update Genres if array provided
    if (Array.isArray(genre_ids)) {
      await client.query('DELETE FROM musician_genres WHERE musician_profile_id = $1', [profileId]);
      for (const genreId of genre_ids) {
        await client.query(
          'INSERT INTO musician_genres (musician_profile_id, genre_id) VALUES ($1, $2)',
          [profileId, genreId]
        );
      }
    }

    await client.query('COMMIT'); // Commit transaction
    res.json({ message: 'Profile updated successfully!' });
  } catch (err) {
    await client.query('ROLLBACK'); // Undo all changes on error
    console.error('Update Profile Error:', err.message);
    res.status(500).json({ message: 'Server error during update.' });
  } finally {
    client.release(); // Return client back to pool
  }
});

// 4. GET ALL / SEARCH MUSICIANS (Public - with query parameters)
router.get('/', async (req, res) => {
  const { instrument, genre, location, search } = req.query;

  try {
    let query = `
      SELECT 
        u.id AS user_id,
        u.full_name,
        mp.id AS profile_id,
        mp.bio,
        mp.location,
        mp.hourly_rate,
        mp.profile_picture_url,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', i.id, 'name', i.name)) 
          FILTER (WHERE i.id IS NOT NULL), '[]'
        ) AS instruments,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', g.id, 'name', g.name)) 
          FILTER (WHERE g.id IS NOT NULL), '[]'
        ) AS genres
      FROM users u
      JOIN musician_profiles mp ON u.id = mp.user_id
      LEFT JOIN musician_instruments mi ON mp.id = mi.musician_profile_id
      LEFT JOIN instruments i ON mi.instrument_id = i.id
      LEFT JOIN musician_genres mg ON mp.id = mg.musician_profile_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      WHERE u.role = 'musician'
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Dynamic Filter: Location
    if (location) {
      query += ` AND LOWER(mp.location) LIKE LOWER($${paramIndex})`;
      queryParams.push(`%${location}%`);
      paramIndex++;
    }

    // Dynamic Filter: Search keyword (matches full_name or bio)
    if (search) {
      query += ` AND (LOWER(u.full_name) LIKE LOWER($${paramIndex}) OR LOWER(mp.bio) LIKE LOWER($${paramIndex}))`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    query += ` GROUP BY u.id, mp.id`;

    // Having filters for array matching (Instrument / Genre)
    let havingConditions = [];
    if (instrument) {
      havingConditions.push(`bool_or(LOWER(i.name) = LOWER($${paramIndex}))`);
      queryParams.push(instrument);
      paramIndex++;
    }

    if (genre) {
      havingConditions.push(`bool_or(LOWER(g.name) = LOWER($${paramIndex}))`);
      queryParams.push(genre);
      paramIndex++;
    }

    if (havingConditions.length > 0) {
      query += ` HAVING ` + havingConditions.join(' AND ');
    }

    const result = await pool.query(query, queryParams);
    res.json({ musicians: result.rows });
  } catch (err) {
    console.error('Search Musicians Error:', err.message);
    res.status(500).json({ message: 'Server error during search.' });
  }
});

// 5. GET SINGLE MUSICIAN PROFILE BY PROFILE ID (Public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        u.id AS user_id,
        u.full_name,
        u.email,
        mp.id AS profile_id,
        mp.bio,
        mp.location,
        mp.hourly_rate,
        mp.profile_picture_url,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', i.id, 'name', i.name)) 
          FILTER (WHERE i.id IS NOT NULL), '[]'
        ) AS instruments,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', g.id, 'name', g.name)) 
          FILTER (WHERE g.id IS NOT NULL), '[]'
        ) AS genres
      FROM users u
      JOIN musician_profiles mp ON u.id = mp.user_id
      LEFT JOIN musician_instruments mi ON mp.id = mi.musician_profile_id
      LEFT JOIN instruments i ON mi.instrument_id = i.id
      LEFT JOIN musician_genres mg ON mp.id = mg.musician_profile_id
      LEFT JOIN genres g ON mg.genre_id = g.id
      WHERE mp.id = $1 AND u.role = 'musician'
      GROUP BY u.id, mp.id;
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Musician not found.' });
    }

    res.json({ musician: result.rows[0] });
  } catch (err) {
    console.error('Get Single Musician Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;