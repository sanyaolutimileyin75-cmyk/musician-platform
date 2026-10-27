import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import './MusicianProfile.css';

export default function MusicianProfile() {
  const [meta, setMeta] = useState({ instruments: [], genres: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Form State
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);

  // 1. Fetch metadata (instruments/genres) and musician's profile concurrently
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [metaData, profileData] = await Promise.all([
          apiFetch('/musicians/meta'),
          apiFetch('/musicians/me'),
        ]);

        setMeta(metaData);

        const p = profileData.profile;
        if (p) {
          setBio(p.bio || '');
          setLocation(p.location || '');
          setHourlyRate(p.hourly_rate || '');
          setSelectedInstrumentIds(p.instruments ? p.instruments.map((i) => i.id) : []);
          setSelectedGenreIds(p.genres ? p.genres.map((g) => g.id) : []);
        }
      } catch (err) {
        setMsg({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // 2. Toggle selection helpers
  const toggleInstrument = (id) => {
    setSelectedInstrumentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleGenre = (id) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 3. Save profile updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    try {
      await apiFetch('/musicians/me', {
        method: 'PUT',
        body: JSON.stringify({
          bio,
          location,
          hourly_rate: parseFloat(hourlyRate) || 0,
          instrument_ids: selectedInstrumentIds,
          genre_ids: selectedGenreIds,
        }),
      });

      setMsg({ type: 'success', text: 'Profile saved successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-edit-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p>Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="profile-edit-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Edit Musician Profile</h1>
          <p>Update your details so clients can discover and book you</p>
        </div>

        {msg.text && <div className={`status-alert ${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="location">Location / Base City</label>
              <input
                id="location"
                type="text"
                placeholder="e.g. Lagos, Nigeria"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="hourlyRate">Hourly Rate ($ USD)</label>
              <input
                id="hourlyRate"
                type="number"
                min="0"
                step="5"
                placeholder="e.g. 150"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="bio">Musician Bio</label>
            <textarea
              id="bio"
              placeholder="Tell clients about your performance experience, event types you specialize in, etc."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* INSTRUMENTS CHIPS */}
          <div style={{ marginTop: '1.5rem' }}>
            <span className="section-label">Instruments You Play</span>
            <div className="chips-container">
              {meta.instruments.map((inst) => {
                const isSelected = selectedInstrumentIds.includes(inst.id);
                return (
                  <button
                    key={inst.id}
                    type="button"
                    className={`chip-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleInstrument(inst.id)}
                  >
                    {isSelected ? '✓ ' : '+ '} {inst.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GENRES CHIPS */}
          <div>
            <span className="section-label">Genres You Perform</span>
            <div className="chips-container">
              {meta.genres.map((g) => {
                const isSelected = selectedGenreIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`chip-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleGenre(g.id)}
                  >
                    {isSelected ? '✓ ' : '+ '} {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="btn-save" type="submit" disabled={saving}>
            {saving ? 'Saving changes...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}