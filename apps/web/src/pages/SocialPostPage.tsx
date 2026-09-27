import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { SocialPost } from '@scd/types';
import { useResource } from '../lib/hooks.js';
import { useAuth } from '../lib/auth.js';
import { useDocumentHead } from '../lib/seo.js';
import { useToast } from '../lib/toast.js';

type PostMode = 'attending' | 'attended' | 'spoke';

export function SocialPostPage() {
  useDocumentHead({ title: 'Social Post Composer · AWS SCD 2026' });
  const { user } = useAuth();
  const { data: me } = useResource<{ attendee?: { fullName: string; university?: string } }>('/me');
  const { data: savedPost } = useResource<SocialPost>('/me/social-post');
  const { addToast } = useToast();

  const [mode, setMode] = useState<PostMode>('attending');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [topic, setTopic] = useState('Serverless & AI');

  useEffect(() => {
    if (me?.attendee) {
      setName(me.attendee.fullName);
      setCollege(me.attendee.university || 'Ganpat University');
    } else if (user?.email) {
      setName(user.email.split('@')[0] || 'Riya Patel');
      setCollege('Ganpat University');
    }
  }, [me, user]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const headline = useMemo(() => {
    if (mode === 'attending') return "I'm Attending!";
    if (mode === 'attended') return 'I Attended!';
    return 'I Spoke at SCD!';
  }, [mode]);

  const captionText = useMemo(() => {
    if (mode === 'attending') {
      return `Excited to announce that I'm attending AWS Students Community Day 2026 at Ganpat University on 8 October! Looking forward to learning cloud architecture, building in workshops, and connecting with the community. See you there! @aws.sbg_guni #AWSSCD2026 #CloudClub`;
    }
    if (mode === 'attended') {
      return `Had an amazing time at AWS Students Community Day 2026 at Ganpat University! Full day of hands-on cloud labs, serverless architectures, and networking. Huge thanks to the organizing team! @aws.sbg_guni #AWSSCD2026 #AWS`;
    }
    return `Honored to have spoken at AWS Students Community Day 2026 at Ganpat University! Fantastic energy from students eager to build the future of cloud computing. @aws.sbg_guni #AWSSCD2026 #Speaker`;
  }, [mode]);

  // Render 1080 x 1350 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1350;

    // Purple Gradient Background (poster-inspired)
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGrad.addColorStop(0, '#7C3AED');
    bgGrad.addColorStop(1, '#4C1D95');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle technical grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1080; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1350);
      ctx.stroke();
    }
    for (let y = 0; y < 1350; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // Outer White Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 1000, 1270);

    // Top Header pill badge
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(80, 80, 560, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#4C1D95';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('AWS STUDENTS COMMUNITY DAY 2026', 106, 116);

    // Headline (I'm Attending! / I Attended! / I Spoke!)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 84px system-ui, sans-serif';
    ctx.fillText(headline, 80, 260);

    // Date & Venue
    ctx.fillStyle = '#E9D5FF';
    ctx.font = '600 32px system-ui, sans-serif';
    ctx.fillText('8 October 2026 · Ganpat University, Mehsana', 80, 320);

    // Orange divider (kept as brand accent)
    ctx.fillStyle = '#FF9900';
    ctx.fillRect(80, 360, 180, 8);

    // Center Name Box (white card)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(80, 440, 920, 420, 24);
    ctx.fill();

    // Name inside box
    ctx.fillStyle = '#1E1033';
    ctx.font = '900 64px system-ui, sans-serif';
    ctx.fillText(name || 'Attendee Name', 120, 560);

    // College
    ctx.fillStyle = '#7C3AED';
    ctx.font = '700 36px system-ui, sans-serif';
    ctx.fillText(college || 'Ganpat University', 120, 630);

    // Track/Topic
    ctx.fillStyle = '#6b6478';
    ctx.font = '600 30px system-ui, sans-serif';
    ctx.fillText(`Track: ${topic}`, 120, 700);

    // Check-in status pill
    const statusText =
      mode === 'spoke'
        ? 'STATUS: FEATURED SPEAKER'
        : mode === 'attended'
          ? 'STATUS: ATTENDED'
          : 'STATUS: CONFIRMED PASS';
    ctx.fillStyle = '#4C1D95';
    ctx.beginPath();
    ctx.roundRect(120, 750, 420, 52, 26);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(statusText, 144, 785);

    // Badge circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(880, 560, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#FF9900';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCD', 880, 560);
    ctx.restore();

    // Key Highlights strip
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 32px system-ui, sans-serif';
    ctx.fillText('12 Sessions   ·   4 Workshops   ·   Hackathon & Quiz', 80, 960);

    // Footer
    ctx.fillStyle = '#FF9900';
    ctx.font = '900 36px system-ui, sans-serif';
    ctx.fillText('@aws.sbg_guni', 80, 1220);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '600 28px system-ui, sans-serif';
    ctx.fillText('Centre of Excellence · Ganpat Vidyanagar, Gujarat', 80, 1260);
  }, [headline, name, college, topic]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `aws-scd-2026-${mode}-poster.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    addToast('1080×1350 poster downloaded!', 'success');
  };

  const copyCaption = () => {
    void navigator.clipboard.writeText(captionText).then(() => {
      addToast('Caption copied with handle @aws.sbg_guni', 'success');
    });
  };

  return (
    <div className="section" style={{ padding: '32px 0 60px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 16px' }}>
        <p className="mo" style={{ color: 'var(--scd-muted)', marginBottom: '16px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> / Social post
        </p>

        <div className="c" style={{ gap: '20px' }}>
          <div className="k" style={{ padding: '24px', gap: '16px', background: 'var(--scd-surface)' }}>
            <div>
              <h1 className="d2" style={{ margin: '0 0 4px', fontSize: '26px' }}>Social Post Composer</h1>
              <p className="tx" style={{ color: 'var(--scd-muted)', fontSize: '13px' }}>
                Generate an official branded 1080×1350 social poster to share on LinkedIn and Instagram.
              </p>
            </div>

            {/* Mode Chips: I'm attending · I attended · I spoke (Wireframe 1j) */}
            <div className="r" style={{ gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setMode('attending')}
                className={`chip ${mode === 'attending' ? 'on' : ''}`}
                style={{ cursor: 'pointer', border: '1px solid var(--scd-fg)' }}
              >
                I&apos;m attending
              </button>
              <button
                type="button"
                onClick={() => setMode('attended')}
                className={`chip ${mode === 'attended' ? 'on' : ''}`}
                style={{ cursor: 'pointer', border: '1px solid var(--scd-fg)' }}
              >
                I attended
              </button>
              <button
                type="button"
                onClick={() => setMode('spoke')}
                className={`chip ${mode === 'spoke' ? 'on' : ''}`}
                style={{ cursor: 'pointer', border: '1px solid var(--scd-fg)' }}
              >
                I spoke
              </button>
            </div>

            {/* Main Composer Split: Live Canvas Preview + Form Fields */}
            <div className="r" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginTop: '8px' }}>
              {/* Canvas Preview Container (1080x1350 ratio = 4:5) */}
              <div
                style={{
                  flex: '0 0 240px',
                  aspectRatio: '4/5',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1.5px solid var(--scd-primary)',
                  boxShadow: 'var(--scd-shadow-sm)',
                  position: 'relative',
                  background: '#4C1D95',
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              </div>

              {/* Form and Actions */}
              <div className="c" style={{ flex: '1 1 300px', gap: '12px' }}>
                <div className="kd" style={{ background: 'var(--scd-surface-muted)', gap: '4px' }}>
                  <label className="mo" style={{ fontSize: '11px' }}>Your name</label>
                  <input
                    type="text"
                    value={name}
                    placeholder="e.g. Yashas Raj"
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                </div>

                <div className="kd" style={{ background: 'var(--scd-surface-muted)', gap: '4px' }}>
                  <label className="mo" style={{ fontSize: '11px' }}>College / University</label>
                  <input
                    type="text"
                    value={college}
                    placeholder="e.g. Ganpat University"
                    onChange={(e) => setCollege(e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                </div>

                <div className="kd" style={{ background: 'var(--scd-surface-muted)', gap: '4px' }}>
                  <label className="mo" style={{ fontSize: '11px' }}>Primary Track / Interest</label>
                  <input
                    type="text"
                    value={topic}
                    placeholder="e.g. Serverless & AI"
                    onChange={(e) => setTopic(e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                </div>

                <div className="r" style={{ gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={downloadPNG}
                    className="btn o"
                    style={{ minHeight: '44px', padding: '0 20px', cursor: 'pointer' }}
                  >
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={copyCaption}
                    className="btn g"
                    style={{ minHeight: '44px', padding: '0 20px', cursor: 'pointer' }}
                  >
                    Copy caption
                  </button>
                </div>

                <div className="kd" style={{ background: '#fff', padding: '10px' }}>
                  <p className="mo" style={{ fontSize: '10px', color: 'var(--scd-muted)', marginBottom: '4px' }}>
                    Caption preview (includes @aws.sbg_guni)
                  </p>
                  <p className="tx" style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--scd-fg)' }}>
                    {captionText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
