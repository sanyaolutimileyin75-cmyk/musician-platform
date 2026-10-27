import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api.js';
import './Auth.css'; // Reusing the same beautiful CSS from Login

export default function Register() {
  const navigate = useNavigate();

  // 1. We store all form fields in one object to keep state clean
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'client', // Default to client
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 2. This handles typing in ANY input field dynamically
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 3. Submit handler talks to our Express API
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page reload
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // Calls POST http://localhost:5000/api/auth/register
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      // 4. On success, show message and redirect to login
      setSuccessMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000); // wait 2 seconds, then go to login

    } catch (err) {
      setError(err.message); // Displays error from backend (e.g., "Email already registered")
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create an Account</h1>
        <p className="auth-subtitle">Join GigMatch to find or play gigs</p>

        {/* Display Error or Success Messages */}
        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-error" style={{ backgroundColor: '#ecfdf5', color: '#15803d', borderColor: '#a7f3d0' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              placeholder="John Doe"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I want to...</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="client">Hire musicians (Client)</option>
              <option value="musician">Get booked for gigs (Musician)</option>
            </select>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}