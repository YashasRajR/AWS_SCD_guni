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

    // Dark Navy Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGrad.addColorStop(0, '#232F3E');
    bgGrad.addColorStop(1, '#16191F');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle technical grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
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

    // Outer Orange Border
    ctx.strokeStyle = '#FF9900';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 1000, 1270);

    // Top Header
    ctx.fillStyle = '#FF9900';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('AWS STUDENTS COMMUNITY DAY 2026', 80, 120);

    // Headline (I'm Attending! / I Attended! / I Spoke!)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 80px system-ui, sans-serif';
    ctx.fillText(headline, 80, 230);

    // Date & Venue
    ctx.fillStyle = '#cfc9be';
    ctx.font = '500 32px monospace';
    ctx.fillText('8 October 2026 · Ganpat University, Mehsana', 80, 290);

    // Orange divider
    ctx.fillStyle = '#FF9900';
    ctx.fillRect(80, 330, 180, 6);

    // Center Name Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(80, 440, 920, 420);
    ctx.strokeStyle = 'rgba(255, 153, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 440, 920, 420);

    // Name inside box
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 64px system-ui, sans-serif';
    ctx.fillText(name || 'Attendee Name', 120, 560);

    // College
    ctx.fillStyle = '#FF9900';
    ctx.font = '600 36px system-ui, sans-serif';
    ctx.fillText(college || 'Ganpat University', 120, 630);

    // Track/Topic
    ctx.fillStyle = '#9a958c';
    ctx.font = '30px monospace';
    ctx.fillText(`Track: ${topic}`, 120, 700);

    // Check-in status
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('STATUS: CONFIRMED PASS', 120, 790);

    // Mascot representation / circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(880, 560, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#FF9900';
    ctx.fill();
    ctx.fillStyle = '#232F3E';
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCD', 880, 560);
    ctx.restore();

    // Key Highlights strip
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillText('☁️ 12 Sessions   🛠️ 4 Workshops   🏆 Hackathon & Quiz', 80, 960);

    // Footer
    ctx.fillStyle = '#FF9900';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('@aws.sbg_guni', 80, 1220);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '28px system-ui, sans-serif';
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
          <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</Link> / Social post
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
                  background: '#232F3E',
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
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                </div>

                <div className="kd" style={{ background: 'var(--scd-surface-muted)', gap: '4px' }}>
                  <label className="mo" style={{ fontSize: '11px' }}>College / University</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                </div>

                <div className="kd" style={{ background: 'var(--scd-surface-muted)', gap: '4px' }}>
                  <label className="mo" style={{ fontSize: '11px' }}>Primary Track / Interest</label>
                  <input
                    type="text"
                    value={topic}
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
