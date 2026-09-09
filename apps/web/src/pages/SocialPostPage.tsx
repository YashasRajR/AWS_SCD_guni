import { useEffect, useRef, useState } from 'react';
import type { SocialPost } from '@scd/types';
import { ApiClientError } from '@scd/api-client';
import { useResource } from '../lib/hooks.js';
import { apiClient } from '../lib/api.js';
import { uploadSocialPostPhoto } from '../lib/uploads.js';
import { useDocumentHead } from '../lib/seo.js';

const INTEREST_OPTIONS = [
  'Cloud Computing',
  'Machine Learning',
  'DevOps',
  'Serverless',
  'Security',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Networking',
  'Open Source',
];

/** Renders a shareable branded card entirely client-side (canvas) — no
 * server-side image generation needed. Falls back to initials if the
 * uploaded photo can't be drawn (e.g. blocked by CORS from local-disk
 * storage in dev). */
function BrandedImageCard({ post, fullName }: { post: SocialPost; fullName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    setRenderError(null);

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    const drawFrame = () => {
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, '#232f3e');
      gradient.addColorStop(1, '#ff9900');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText("I'm attending", 60, 120);
      ctx.font = 'bold 52px sans-serif';
      ctx.fillText('AWS Student Community Day 2026', 60, 185, W - 120);

      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(fullName, 60, 480);

      ctx.font = '28px sans-serif';
      ctx.fillText(post.interests.slice(0, 3).join('  ·  '), 60, 525);

      ctx.font = '24px sans-serif';
      ctx.fillText(post.hashtags.slice(0, 4).join('  '), 60, H - 50);
    };

    const drawAvatarCircle = (drawImage: (() => void) | null) => {
      const cx = W - 200;
      const cy = 200;
      const r = 110;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
      if (drawImage) {
        ctx.clip();
        drawImage();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fullName.charAt(0).toUpperCase(), cx, cy + 8);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      ctx.restore();
    };

    drawFrame();

    if (post.photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        drawFrame();
        drawAvatarCircle(() => ctx.drawImage(img, W - 310, 90, 220, 220));
      };
      img.onerror = () => {
        setRenderError('Could not load the photo for the branded image (showing initials instead).');
        drawAvatarCircle(null);
      };
      img.src = post.photoUrl;
    } else {
      drawAvatarCircle(null);
    }
  }, [post.photoUrl, post.interests, post.hashtags, fullName]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my-scd-post.png';
      link.click();
    } catch {
      setRenderError('Could not export the image — the photo may be blocked by the browser (CORS). Try without a photo.');
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Branded image</h3>
      <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 600, borderRadius: 8 }} />
      {renderError && <p className="form-error">{renderError}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={download}>
          Download image
        </button>
      </div>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-link"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

export function SocialPostPage() {
  useDocumentHead({ title: 'Create My SCD Post' });
  const { data: post, loading, error, reload } = useResource<SocialPost>('/me/social-post');
  const { data: me } = useResource<{ user: { id: string }; attendee: { fullName: string } | null }>('/me');

  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (post) {
      setBio(post.bio);
      setInterests(post.interests);
      setPhotoUrl(post.photoUrl ?? undefined);
    }
  }, [post]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : prev.length < 10 ? [...prev, interest] : prev,
    );
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      setPhotoUrl(await uploadSocialPostPhoto(file));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (bio.trim().length < 10) {
      setFormError('Bio must be at least 10 characters.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await apiClient.put('/me/social-post', { bio: bio.trim(), interests, photoUrl });
      reload();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Failed to generate post.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    setFormError(null);
    try {
      await apiClient.post('/me/social-post/approve');
      reload();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Failed to approve post.');
    } finally {
      setApproving(false);
    }
  };

  const share = async (platform: 'LINKEDIN' | 'INSTAGRAM') => {
    apiClient.post('/me/social-post/share', { platform }).catch(() => {
      /* best-effort history log — never blocks the actual share */
    });
    if (platform === 'LINKEDIN' && post) {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(post.eventUrl)}`,
        '_blank',
        'noopener,noreferrer',
      );
    }
    // Instagram has no web share-intent for posting text -- the caption is
    // copied instead and the attendee pastes it into the Instagram app
    // themselves (spec: "official APIs or supported sharing mechanisms" --
    // never request/store Instagram credentials).
  };

  const fullName = me?.attendee?.fullName ?? '';

  return (
    <div className="page-section">
      <header className="page-section-header">
        <h1>Create My SCD Post</h1>
        <p className="page-section-lede">
          Generate a LinkedIn post and Instagram caption announcing that you're attending — built from what you enter
          below plus official event details, never invented.
        </p>
      </header>

      {loading && <p className="status-line">Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Your details</h2>
          <label className="form-field">
            <span>Short bio</span>
            <textarea
              rows={3}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Final-year CS student passionate about cloud and building for scale."
            />
          </label>

          <label className="form-field">
            <span>Interests (up to 10)</span>
          </label>
          <div className="dashboard-card-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                type="button"
                className={interests.includes(interest) ? 'filter-chip filter-chip-active' : 'filter-chip'}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>

          <label className="form-field">
            <span>Photo (optional)</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handlePhotoChange} />
          </label>
          {uploading && <p className="status-line">Uploading…</p>}
          {photoUrl && <img src={photoUrl} alt="Your photo" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} />}

          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={saving || uploading}>
              {saving ? 'Generating…' : post ? 'Regenerate' : 'Generate my post'}
            </button>
          </div>
        </section>

        {post && (
          <>
            <section className="dashboard-card">
              <h2>Preview &amp; edit</h2>
              <p className="dashboard-card-row">
                {post.approvedAt ? (
                  <span className="status-line">Approved — copy is final until you regenerate.</span>
                ) : (
                  <span className="status-line">Draft — review, then approve when you're happy with it.</span>
                )}
              </p>

              <h3>LinkedIn</h3>
              <pre className="status-line" style={{ whiteSpace: 'pre-wrap' }}>{post.linkedinText}</pre>
              <CopyButton text={post.linkedinText} label="Copy LinkedIn post" />
              {' '}
              <button type="button" className="btn-link" onClick={() => share('LINKEDIN')}>
                Share on LinkedIn
              </button>

              <h3>Instagram</h3>
              <pre className="status-line" style={{ whiteSpace: 'pre-wrap' }}>{post.instagramText}</pre>
              <CopyButton text={post.instagramText} label="Copy Instagram caption" />
              {' '}
              <button type="button" className="btn-link" onClick={() => share('INSTAGRAM')}>
                Mark as shared on Instagram
              </button>

              <div className="form-actions">
                <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={approving || !!post.approvedAt}>
                  {approving ? 'Approving…' : post.approvedAt ? 'Approved' : 'Approve'}
                </button>
              </div>
            </section>

            <BrandedImageCard post={post} fullName={fullName} />
          </>
        )}
      </div>
    </div>
  );
}
