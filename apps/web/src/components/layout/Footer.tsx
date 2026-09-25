import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

// Handcrafted SVG icons matching AWS_GUNI-main exactly (no external dependency needed)
const LogoSvg = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 9 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="sbg-footer-logo-svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M 2 1 V 0 H 3 V 1 H 4 V 0 H 5 V 1 H 6 V 0 H 7 V 2 H 2 Z M 8 2 H 9 V 3 H 8 V 4 H 9 V 5 H 8 V 6 H 9 V 7 H 7 V 2 Z M 7 8 V 9 H 6 V 8 H 5 V 9 H 4 V 8 H 3 V 9 H 2 V 7 H 7 Z M 1 7 H 0 V 6 H 1 V 5 H 0 V 4 H 1 V 3 H 0 V 2 H 2 V 7 Z"
      fill="currentColor"
    />
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const MeetupIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
    <path d="M6.98.555a.518.518 0 0 0-.105.011.53.53 0 1 0 .222 1.04.533.533 0 0 0 .409-.633.531.531 0 0 0-.526-.418zm6.455.638a.984.984 0 0 0-.514.143.99.99 0 1 0 1.02 1.699.99.99 0 0 0 .34-1.36.992.992 0 0 0-.846-.482zm-3.03 2.236a5.029 5.029 0 0 0-4.668 3.248 3.33 3.33 0 0 0-1.46.551 3.374 3.374 0 0 0-.94 4.562 3.634 3.634 0 0 0-.605 4.649 3.603 3.603 0 0 0 2.465 1.597c.018.732.238 1.466.686 2.114a3.9 3.9 0 0 0 5.423.992c.068-.047.12-.106.184-.157.987.881 2.47 1.026 3.607.24a2.91 2.91 0 0 0 1.162-1.69 4.238 4.238 0 0 0 2.584-.739 4.274 4.274 0 0 0 1.19-5.789 2.466 2.466 0 0 0 .433-3.308 2.448 2.448 0 0 0-1.316-.934 4.436 4.436 0 0 0-.776-2.873 4.467 4.467 0 0 0-5.195-1.656 5.106 5.106 0 0 0-2.773-.807z"/>
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sbg-footer-contact-icon">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sbg-footer-contact-icon">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L1 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sbg-footer-contact-icon">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="sbg-footer">
      {/* Background space glow grid */}
      <div className="sbg-footer-glow-1" />
      <div className="sbg-footer-glow-2" />

      <div className="sbg-footer-container">
        <div className="sbg-footer-grid">
          {/* Column 1: Brand Info & Socials */}
          <div className="sbg-footer-brand">
            <Link to="/" className="sbg-footer-brand-header">
              <LogoSvg size={24} />
              <div className="sbg-footer-brand-titles">
                <span className="sbg-footer-brand-name">
                  AWS Student Builder Group
                </span>
                <span className="sbg-footer-brand-sub">
                  Ganpat University
                </span>
              </div>
            </Link>

            <p className="sbg-footer-desc">
              A platform to learn, build, and innovate with the power of AWS Cloud. Connecting students with hands-on learning, innovation, and real-world opportunities.
            </p>

            {/* Social Links */}
            <div className="sbg-footer-socials">
              <a
                href="https://www.linkedin.com/company/aws-student-builder-group-guni/"
                target="_blank"
                rel="noopener noreferrer"
                className="sbg-footer-social-btn"
                aria-label="LinkedIn Profile"
              >
                <LinkedinIcon />
              </a>
              <a
                href="https://www.meetup.com/aws-sbg-at-ganpat-university/"
                target="_blank"
                rel="noopener noreferrer"
                className="sbg-footer-social-btn"
                aria-label="Meetup Community Group"
              >
                <MeetupIcon />
              </a>
            </div>
          </div>

          {/* Column 2: Event Program */}
          <div className="sbg-footer-nav">
            <h4 className="sbg-footer-title">
              Event Program
            </h4>
            <ul className="sbg-footer-nav-list">
              <li>
                <Link to="/" className="sbg-footer-nav-link">
                  Home
                </Link>
              </li>
              <li>
                <a href="/#about" className="sbg-footer-nav-link">
                  About Us
                </a>
              </li>
              <li>
                <Link to="/speakers" className="sbg-footer-nav-link">
                  Speakers
                </Link>
              </li>
              <li>
                <Link to="/sessions" className="sbg-footer-nav-link">
                  Sessions &amp; Tracks
                </Link>
              </li>
              <li>
                <Link to="/agenda" className="sbg-footer-nav-link">
                  Agenda &amp; Schedule
                </Link>
              </li>
              <li>
                <Link to="/timeline" className="sbg-footer-nav-link">
                  Event Timeline
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Guide & Attend */}
          <div className="sbg-footer-nav">
            <h4 className="sbg-footer-title">
              Explore &amp; Attend
            </h4>
            <ul className="sbg-footer-nav-list">
              <li>
                <Link to="/venue" className="sbg-footer-nav-link">
                  Venue &amp; Location
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="sbg-footer-nav-link">
                  Activity Gallery
                </Link>
              </li>
              <li>
                <Link to="/past-events" className="sbg-footer-nav-link">
                  Past Editions
                </Link>
              </li>
              <li>
                <Link to="/faq" className="sbg-footer-nav-link">
                  FAQs &amp; Help
                </Link>
              </li>
              <li>
                <Link to="/register" className="sbg-footer-nav-link accent-link">
                  Register Now &rarr;
                </Link>
              </li>
              <li>
                <Link to="/login" className="sbg-footer-nav-link">
                  Attendee Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Details */}
          <div className="sbg-footer-contact">
            <h4 className="sbg-footer-title">
              Reach Out
            </h4>
            <ul className="sbg-footer-contact-list">
              <li className="sbg-footer-contact-item">
                <MapPinIcon />
                <span>
                  Ganpat University (GNUI), Mehsana-Gandinagar Highway, Kherva, Gujarat, India - 384315.
                </span>
              </li>
              <li className="sbg-footer-contact-item">
                <MailIcon />
                <a href="mailto:aws.sbg@ganpatuniversity.ac.in">
                  aws.sbg@ganpatuniversity.ac.in
                </a>
              </li>
              <li className="sbg-footer-contact-item">
                <PhoneIcon />
                <a href="tel:+917984961282">
                  +91 79849 61282
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="sbg-footer-divider" />

        {/* Footer bottom */}
        <div className="sbg-footer-bottom">
          <p>
            &copy; {currentYear} AWS Student Builder Group - Ganpat University. All rights reserved.
          </p>
          <div className="sbg-footer-bottom-links">
            <a href="#privacy">
              Privacy Policy
            </a>
            <a href="#terms">
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
