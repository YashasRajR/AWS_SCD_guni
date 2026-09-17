import { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { VenueGrid } from '../components/venues/VenueGrid.js';
import { useDocumentHead } from '../lib/seo.js';
import { useToast } from '../lib/toast.js';

const TRANSPORT_TABS = [
  {
    id: 'bus',
    label: 'Bus',
    title: 'By State Transport & Private Bus',
    details:
      'GSRTC buses run frequently from Ahmedabad (Gita Mandir / Ranip) and Mehsana bus depots. Get down directly at Ganpat Vidyanagar stop right outside the main campus gate. 5 min walk to Centre of Excellence.',
  },
  {
    id: 'train',
    label: 'Train',
    title: 'By Railway',
    details:
      'Nearest major rail junctions are Mehsana Junction (MSH, 22 km) and Ahmedabad Junction (ADI, 68 km). Local express trains and shared cabs run continuously between Mehsana station and Kherva / GUNI.',
  },
  {
    id: 'car',
    label: 'Car',
    title: 'By Private Vehicle or Cab',
    details:
      'Drive via Ahmedabad - Mehsana Highway (SH-41) or Mehsana - Gandhinagar route. Turn towards Kherva. Navigate to Ganpat University Gate 2. Ample designated free parking is available inside Gate 2.',
  },
  {
    id: 'gate',
    label: 'Gate & Wayfinding',
    title: 'Campus Arrival & Check-in',
    details:
      'Enter through Gate 2 (Main Gate). Follow AWS SCD banners towards the Centre of Excellence (CoE) Building. Registration and badge check-in volunteers are stationed at the ground floor foyer.',
  },
];

const VENUE_ADDRESS = 'Centre of Excellence, Ganpat Vidyanagar, Mehsana - Gozaria Highway, Gujarat 384012';
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Centre+of+Excellence+Ganpat+University+Mehsana';

export function VenuePage() {
  const [activeTab, setActiveTab] = useState('bus');
  const { addToast } = useToast();

  useDocumentHead({
    title: 'Venue',
    description: 'Where to find us at Ganpat University for AWS Student Community Day 2026.',
  });

  const copyAddress = () => {
    void navigator.clipboard.writeText(VENUE_ADDRESS).then(() => {
      addToast('Address copied to clipboard', 'success');
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % TRANSPORT_TABS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + TRANSPORT_TABS.length) % TRANSPORT_TABS.length;
    } else {
      return;
    }
    e.preventDefault();
    setActiveTab(TRANSPORT_TABS[nextIndex]!.id);
  };

  const currentTab = TRANSPORT_TABS.find((t) => t.id === activeTab) ?? TRANSPORT_TABS[0]!;

  return (
    <div>
      <div className="page-hero" style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--scd-border)' }}>
        <PageContainer>
          <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '8px' }}>
            06 / Venue
          </p>
          <h1 className="d1" style={{ fontSize: '36px', marginBottom: '8px' }}>
            Where to find us
          </h1>
          <p className="tx" style={{ fontSize: '14px', maxWidth: '640px' }}>
            Centre of Excellence, Ganpat University, Mehsana, Gujarat. Plan your travel, arrival gate, and room locations.
          </p>
        </PageContainer>
      </div>

      <div className="section" style={{ padding: '32px 0 60px' }}>
        <PageContainer>
          {/* Wireframe 1f Wayfinding Layout */}
          <div className="r" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '40px' }}>
            {/* Left Column: Campus visual + address card + parking/food */}
            <div className="c" style={{ flex: '1.2 1 360px', gap: '14px' }}>
              {/* 16:9 Campus Photo container */}
              <div
                style={{
                  aspectRatio: '16/9',
                  width: '100%',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  border: '1.25px solid var(--scd-border)',
                  background: 'linear-gradient(135deg, #232F3E 0%, #16191F 100%)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ textAlign: 'center', color: '#fff', padding: '16px' }}>
                  <p className="mo" style={{ color: 'var(--scd-accent)', letterSpacing: '0.15em' }}>
                    CAMPUS · GANPAT UNIVERSITY
                  </p>
                  <p className="d2" style={{ fontSize: '20px', margin: '4px 0 0' }}>
                    Centre of Excellence
                  </p>
                  <p className="tx" style={{ color: '#cfc9be', fontSize: '12px' }}>
                    Kherva, Mehsana, Gujarat 384012
                  </p>
                </div>
              </div>

              {/* Main address card */}
              <div className="k" style={{ gap: '10px', padding: '16px' }}>
                <h2 className="d3" style={{ margin: 0 }}>Ganpat University</h2>
                <p className="tx" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                  {VENUE_ADDRESS}
                </p>
                <div className="r" style={{ gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button type="button" onClick={copyAddress} className="btn g" style={{ cursor: 'pointer' }}>
                    Copy address
                  </button>
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn o"
                    style={{ textDecoration: 'none' }}
                  >
                    Get directions →
                  </a>
                </div>
              </div>

              {/* Parking and Food sub-cards */}
              <div className="r" style={{ gap: '12px', flexWrap: 'wrap' }}>
                <div className="kd" style={{ flex: 1, minWidth: '140px', background: 'var(--scd-surface)' }}>
                  <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>Parking</p>
                  <p className="lbl" style={{ margin: '2px 0 0' }}>Free, gate 2 lot</p>
                  <p className="tx" style={{ fontSize: '11px' }}>Attendants assist at entrance</p>
                </div>
                <div className="kd" style={{ flex: 1, minWidth: '140px', background: 'var(--scd-surface)' }}>
                  <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>Food</p>
                  <p className="lbl" style={{ margin: '2px 0 0' }}>Campus canteen</p>
                  <p className="tx" style={{ fontSize: '11px' }}>Open all day with meals &amp; snacks</p>
                </div>
              </div>
            </div>

            {/* Right Column: Contained Map Area + How to Reach Tabs */}
            <div className="c" style={{ flex: '1 1 340px', gap: '14px' }}>
              {/* Contained Map Area (never full width) */}
              <div
                className="k"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  aspectRatio: '16/10',
                  maxHeight: '260px',
                  border: '1.25px solid var(--scd-border)',
                }}
              >
                <iframe
                  title="Ganpat University Map"
                  src="https://maps.google.com/maps?q=Ganpat+University+Mehsana&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>

              {/* How to reach tabs (ARIA compliant, arrow-key navigable) */}
              <div className="k mut" style={{ padding: '16px', gap: '12px' }}>
                <p className="mo" style={{ color: 'var(--scd-muted)' }}>How to reach</p>

                <div
                  role="tablist"
                  aria-label="Transport modes"
                  className="r"
                  style={{ gap: '6px', flexWrap: 'wrap' }}
                >
                  {TRANSPORT_TABS.map((tab, idx) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        id={`tab-${tab.id}`}
                        aria-selected={isSelected}
                        aria-controls={`panel-${tab.id}`}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => setActiveTab(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        className={`chip ${isSelected ? 'on' : ''}`}
                        style={{
                          cursor: 'pointer',
                          border: '1px solid var(--scd-fg)',
                          fontFamily: 'var(--scd-mono)',
                          fontSize: '11px',
                          padding: '6px 12px',
                          background: isSelected ? 'var(--scd-accent)' : 'var(--scd-surface)',
                          color: 'var(--scd-fg)',
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  role="tabpanel"
                  id={`panel-${currentTab.id}`}
                  aria-labelledby={`tab-${currentTab.id}`}
                  className="kd"
                  style={{ background: 'var(--scd-surface)', padding: '12px' }}
                >
                  <p className="lbl" style={{ margin: '0 0 4px', fontSize: '13px' }}>
                    {currentTab.title}
                  </p>
                  <p className="tx" style={{ fontSize: '12px', lineHeight: 1.55 }}>
                    {currentTab.details}
                  </p>
                </div>
              </div>

              <div className="kd" style={{ background: 'var(--scd-surface)', padding: '12px' }}>
                <p className="mo" style={{ color: 'var(--scd-muted)', fontSize: '11px' }}>Campus info</p>
                <p className="tx" style={{ fontSize: '12px' }}>
                  Enter via Gate 2 → Follow signage to Centre of Excellence (CoE) → Check in at Ground Floor Foyer.
                </p>
              </div>
            </div>
          </div>

          {/* Individual Venue Rooms & Labs from database */}
          <div className="c" style={{ gap: '16px', marginTop: '32px' }}>
            <div className="c" style={{ gap: '4px' }}>
              <p className="mo" style={{ color: 'var(--scd-muted)' }}>Rooms &amp; stages</p>
              <h2 className="d2" style={{ fontSize: '24px', margin: 0 }}>Specific event locations</h2>
            </div>
            <VenueGrid />
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
