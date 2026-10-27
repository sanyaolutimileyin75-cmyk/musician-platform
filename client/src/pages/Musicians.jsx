import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.js';
import { apiFetch } from '../services/api.js';
import BookingModal from '../components/BookingModal';
import './Musicians.css';

function MusiciansSkeleton() {
  return (
    <div className="musicians-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="skeleton-card">
          <div style={{ height: 90, background: '#1e293b' }} />
          <div style={{ padding: '1.25rem' }}>
            <div className="skeleton skeleton-line medium" />
            <div className="skeleton skeleton-line long" />
            <div className="skeleton skeleton-line short" style={{ marginTop: '1rem' }} />
            <div className="skeleton skeleton-line medium" />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1.25rem',
              }}
            >
              <div className="skeleton" style={{ width: 70, height: 24 }} />
              <div className="skeleton" style={{ width: 110, height: 36, borderRadius: 8 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Musicians() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [musicians, setMusicians] = useState([]);
  const [meta, setMeta] = useState({ instruments: [], genres: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [instrument, setInstrument] = useState('');
  const [genre, setGenre] = useState('');
  const [location, setLocation] = useState('');

  // Booking modal
  const [selectedMusician, setSelectedMusician] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState('');

  // Load filter dropdown data
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const data = await apiFetch('/musicians/meta');
        setMeta(data);
      } catch (err) {
        console.error('Failed to load meta:', err.message);
      }
    };
    fetchMeta();
  }, []);

  // Load musicians whenever filters change
  useEffect(() => {
    let isMounted = true;

    const fetchMusicians = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (instrument) params.append('instrument', instrument);
        if (genre) params.append('genre', genre);
        if (location) params.append('location', location);

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const data = await apiFetch(`/musicians${queryString}`);

        if (isMounted) {
          setMusicians(data.musicians || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setMusicians([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchMusicians, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, instrument, genre, location]);

  const handleBookClick = (musician) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'musician') {
      alert('Musician accounts cannot book other musicians. Please use a client account.');
      return;
    }
    setSelectedMusician(musician);
  };

  return (
    <div className="directory-container fade-in">
      <div className="directory-header">
        <h1>Discover Top Live Musicians</h1>
        <p>Book verified soloists, bands, and performers for your next event</p>
      </div>

      {bookingSuccess && (
        <div
          style={{
            marginBottom: '1.5rem',
            textAlign: 'center',
            background: '#ecfdf5',
            color: '#15803d',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid #a7f3d0',
          }}
        >
          {bookingSuccess}
        </div>
      )}

      {selectedMusician && (
        <BookingModal
          musician={selectedMusician}
          onClose={() => setSelectedMusician(null)}
          onSuccess={() => {
            setSelectedMusician(null);
            setBookingSuccess(
              'Booking request sent successfully! Check your dashboard for updates.'
            );
            setTimeout(() => setBookingSuccess(''), 6000);
          }}
        />
      )}

      {/* FILTERS */}
      <div className="filters-card">
        <div className="filter-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search by name or bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="instrument">Instrument</label>
          <select
            id="instrument"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          >
            <option value="">All Instruments</option>
            {meta.instruments.map((inst) => (
              <option key={inst.id} value={inst.name}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="genre">Genre</label>
          <select
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">All Genres</option>
            {meta.genres.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            placeholder="City or region..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      {/* RESULTS */}
      {loading ? (
        <MusiciansSkeleton />
      ) : error ? (
        <div className="empty-state" style={{ color: '#b91c1c' }}>
          <h3>Could not load musicians</h3>
          <p>{error}</p>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
            Is your backend running on port 5000?
          </p>
        </div>
      ) : musicians.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🎷</span>
          <h3>No musicians match your filters</h3>
          <p>
            Try a different instrument, genre, city, or clear your search to see
            more performers.
          </p>
        </div>
      ) : (
        <div className="musicians-grid">
          {musicians.map((m) => (
            <div key={m.profile_id} className="musician-card">
              <div className="card-header">
                <div className="avatar-placeholder">
                  {m.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="card-header-info">
                  <h2>{m.full_name}</h2>
                  <p className="card-location">
                    📍 {m.location || 'Location not specified'}
                  </p>
                </div>
              </div>

              <div className="card-body">
                <p className="card-bio">{m.bio || 'No bio added yet.'}</p>

                <div className="tags-section">
                  <div className="tags-label">Instruments</div>
                  <div className="tags-container">
                    {m.instruments?.length > 0 ? (
                      m.instruments.map((inst) => (
                        <span key={inst.id} className="tag">
                          {inst.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        None specified
                      </span>
                    )}
                  </div>
                </div>

                <div className="tags-section">
                  <div className="tags-label">Genres</div>
                  <div className="tags-container">
                    {m.genres?.length > 0 ? (
                      m.genres.map((g) => (
                        <span key={g.id} className="tag tag-genre">
                          {g.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        None specified
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-footer">
                  <div>
                    <span className="rate-amount">
                      ${parseFloat(m.hourly_rate || 0).toFixed(0)}
                    </span>
                    <span className="rate-unit"> / hr</span>
                  </div>
                  <button className="btn-book" onClick={() => handleBookClick(m)}>
                    Book Musician
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}