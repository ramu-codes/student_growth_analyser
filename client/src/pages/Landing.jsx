import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <h2>GrowthTracker</h2>
        </div>
        <div className="nav-links">
          <Link to="/login" className="nav-link-login">Login</Link>
          <Link to="/register" className="nav-link-register">Get Started</Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>
              Track Your Growth,{' '}
              <span>Powered by AI.</span>
            </h1>
            <p>
              Move beyond grades. Analyze your academic performance with ML-driven insights, 
              subject analytics, and personalized study roadmaps — all in one elegant platform.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="auth-button">Start Tracking →</Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features-section">
          <div className="features-content">
            <h2>Why GrowthTracker?</h2>
            <p>We provide insights, not just data.</p>
            <div className="features-grid">
              <div className="feature-card">
                <h3>📊 Subject Analytics</h3>
                <p>
                  Track subject-wise performance, class rankings, and percentile 
                  scores with interactive charts.
                </p>
              </div>
              <div className="feature-card">
                <h3>🧠 AI-Powered Insights</h3>
                <p>
                  Our ML engine identifies weak areas, predicts growth trajectories, 
                  and generates personalized study roadmaps.
                </p>
              </div>
              <div className="feature-card">
                <h3>🎮 Gamification</h3>
                <p>
                  Earn XP for logging marks and completing goals. 
                  Level up and stay motivated with achievement tracking.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;