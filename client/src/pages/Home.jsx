import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
    return (
        <div style={{ backgroundColor: '#fff' }}>
            {/* 1. PREMIUM HERO SECTION */}
            <section className="hero-wrapper">
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span>⭐</span> Trusted by Event Planners Nationwide
                        </div>
                        <h1 className="hero-title">
                            Elevate Your Event with <span>Live Music</span>
                        </h1>
                        <p className="hero-subtitle">
                            The premier marketplace connecting you with verified saxophonists, bands, DJs, and vocalists. Book world-class talent with transparent pricing and instant availability.
                        </p>

                        <div className="hero-ctas">
                            <Link to="/musicians" className="btn-primary-lg">
                                Browse Performers
                            </Link>
                            <Link to="/register" className="btn-secondary-lg">
                                I am a Musician
                            </Link>
                        </div>
                    </div>

                    <div className="hero-visual">
                        {/* High quality live music placeholder from Unsplash */}
                        <img
                            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop"
                            alt="Live band performing on stage"
                            className="hero-image"
                        />

                        {/* Pure CSS floating profile card for depth */}
                        <div className="hero-floating-card">
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                J
                            </div>
                            <div>
                                <p style={{ fontWeight: '700', color: '#0f172a', margin: 0 }}>John Sax</p>
                                <div style={{ display: 'flex', gap: '5px', marginTop: '3px' }}>
                                    <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>★★★★★</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>(24)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. HOW IT WORKS SECTION */}
            <section className="steps-section">
                <div className="section-header">
                    <h2>How GigMatch Works</h2>
                    <p>Book the perfect live entertainment in three simple steps.</p>
                </div>

                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <h3>Discover Talent</h3>
                        <p>Filter by instrument, genre, and location. Read reviews, compare hourly rates, and find the perfect match for your event's vibe.</p>
                    </div>

                    <div className="step-card">
                        <div className="step-number">2</div>
                        <h3>Send a Request</h3>
                        <p>Select your event date and time slot. Our smart system ensures the musician is available and prevents double-booking automatically.</p>
                    </div>

                    <div className="step-card">
                        <div className="step-number">3</div>
                        <h3>Enjoy the Show</h3>
                        <p>Once the musician accepts, you're locked in! Sit back, enjoy the live performance, and leave a review when the event is completed.</p>
                    </div>
                </div>
            </section>

            {/* 3. DARK CTA FOOTER */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2>Ready to make your event unforgettable?</h2>
                    <p>Join thousands of clients and musicians making live music happen every weekend.</p>
                    <Link to="/register" className="btn-cta">
                        Find Your Musician Today
                    </Link>
                </div>
            </section>
        </div>
    );
}