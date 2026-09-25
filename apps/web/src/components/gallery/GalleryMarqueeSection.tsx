import { useMemo, useState } from 'react';
import type { GalleryItem } from '@scd/types';
import { useGallery } from '../../lib/queries.js';
import { Lightbox } from './GalleryGrid.js';
import './FilmstripGallery.css';

interface FilmPhoto {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
  locationTag: string;
  frameNum: string;
  nextNum: string;
}

const REAL_GALLERY_PHOTOS: FilmPhoto[] = [
  {
    id: 'g1',
    title: 'Cloud Practitioner Essentials Workshop',
    image: '/gallery/workshop1.png',
    category: 'WORKSHOP',
    date: 'March 2026',
    locationTag: 'LAB_ZONE_1',
    frameNum: '01',
    nextNum: '02',
  },
  {
    id: 'g2',
    title: "Keynote Address by Nirmal Pathak Sir",
    image: '/gallery/day2_nirmal_1.png',
    category: 'KEYNOTE',
    date: 'July 2026',
    locationTag: 'MAIN_STAGE',
    frameNum: '02',
    nextNum: '03',
  },
  {
    id: 'g3',
    title: 'AWS Cloud Ignite Community Gathering',
    image: '/gallery/community1.jpeg',
    category: 'COMMUNITY',
    date: 'January 2026',
    locationTag: 'CAMPUS_HALL',
    frameNum: '03',
    nextNum: '04',
  },
  {
    id: 'g4',
    title: 'Cloud Computing Insights by Nilesh Vaghela Sir',
    image: '/gallery/speaker1.png',
    category: 'SPEAKER',
    date: 'March 2026',
    locationTag: 'AUDITORIUM',
    frameNum: '04',
    nextNum: '05',
  },
  {
    id: 'g5',
    title: 'Mastering AWS Cloud Innovation with Manthan Sir',
    image: '/gallery/day2_manthan_1.png',
    category: 'SPEAKER',
    date: 'July 2026',
    locationTag: 'STAGE_EAST',
    frameNum: '05',
    nextNum: '06',
  },
  {
    id: 'g6',
    title: 'Student Community Circle - Concepts to Career',
    image: '/gallery/day2_group_1.png',
    category: 'STUDENT_CIRCLE',
    date: 'July 2026',
    locationTag: 'COMMUNITY_HUB',
    frameNum: '06',
    nextNum: '07',
  },
  {
    id: 'g7',
    title: 'Hands-on EC2 & S3 Sandbox Labs',
    image: '/gallery/workshop2.png',
    category: 'WORKSHOP',
    date: 'May 2026',
    locationTag: 'TECH_LAB',
    frameNum: '07',
    nextNum: '08',
  },
  {
    id: 'g8',
    title: 'Keynote Session by Mr. Ashwin Raiyani',
    image: '/gallery/speaker2.png',
    category: 'SPEAKER',
    date: 'May 2026',
    locationTag: 'MAIN_STAGE',
    frameNum: '08',
    nextNum: '09',
  },
  {
    id: 'g9',
    title: 'Day 2 Closing - Collaboration & Innovation',
    image: '/gallery/day2_group_2.png',
    category: 'CLOSING',
    date: 'July 2026',
    locationTag: 'AMPHITHEATER',
    frameNum: '09',
    nextNum: '10',
  },
  {
    id: 'g10',
    title: 'AWS Student Builder Group Team Meetup',
    image: '/gallery/community2.png',
    category: 'COMMUNITY',
    date: 'January 2026',
    locationTag: 'BUILDER_ZONE',
    frameNum: '10',
    nextNum: '11',
  },
  {
    id: 'g11',
    title: 'AWS Cloud Infrastructure Foundations',
    image: '/gallery/day2_nirmal_2.png',
    category: 'WORKSHOP',
    date: 'July 2026',
    locationTag: 'ACADEMY',
    frameNum: '11',
    nextNum: '12',
  },
  {
    id: 'g12',
    title: 'AWS Community Builder Session',
    image: '/gallery/Aric.png',
    category: 'COMMUNITY',
    date: 'March 2026',
    locationTag: 'CONNECT_LOUNGE',
    frameNum: '12',
    nextNum: '01',
  },
];

const SPROCKET_COUNT = 6;

interface GalleryMarqueeSectionProps {
  id?: string;
  hideHeader?: boolean;
}

export function GalleryMarqueeSection({
  id = 'gallery',
  hideHeader = false,
}: GalleryMarqueeSectionProps) {
  const { items: apiItems } = useGallery();
  const [selectedPhoto, setSelectedPhoto] = useState<FilmPhoto | null>(null);

  // Use dynamic items from the Admin Portal API when available, fallback to real gallery photos
  const allPhotos = useMemo<FilmPhoto[]>(() => {
    if (apiItems && apiItems.length > 0) {
      return apiItems.map((item, idx) => {
        const num = (item.displayOrder || idx + 1).toString().padStart(2, '0');
        const nextNum = (item.displayOrder ? item.displayOrder + 1 : idx + 2).toString().padStart(2, '0');
        return {
          id: item.id,
          title: item.caption ?? item.altText ?? 'Community Moment',
          image: item.imageUrl,
          category: (item.category ?? 'EVENT').toUpperCase(),
          date: item.eventYear ? `${item.eventYear}` : '2026',
          locationTag: (item.category ?? 'COMMUNITY').toUpperCase().replace(/\s+/g, '_'),
          frameNum: num,
          nextNum: nextNum,
        };
      });
    }

    return REAL_GALLERY_PHOTOS;
  }, [apiItems]);

  // Two identical halves for continuous 35mm film rotary loop
  const { setA, setB } = useMemo(() => {
    return {
      setA: allPhotos.map((p) => ({ ...p, uniqueKey: `a-${p.id}` })),
      setB: allPhotos.map((p) => ({ ...p, uniqueKey: `b-${p.id}` })),
    };
  }, [allPhotos]);

  // Convert selected photo to GalleryItem format for Lightbox
  const lightboxItem: GalleryItem | null = selectedPhoto
    ? {
        id: selectedPhoto.id,
        imageUrl: selectedPhoto.image,
        caption: selectedPhoto.title,
        altText: selectedPhoto.title,
        category: selectedPhoto.category,
        eventYear: 2026,
        sessionId: null,
        displayOrder: 0,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : null;

  const currentIdx = selectedPhoto ? allPhotos.findIndex((p) => p.id === selectedPhoto.id) : -1;

  const handlePrev = () => {
    if (currentIdx > 0) {
      setSelectedPhoto(allPhotos[currentIdx - 1] ?? null);
    } else {
      setSelectedPhoto(allPhotos[allPhotos.length - 1] ?? null);
    }
  };

  const handleNext = () => {
    if (currentIdx >= 0 && currentIdx < allPhotos.length - 1) {
      setSelectedPhoto(allPhotos[currentIdx + 1] ?? null);
    } else {
      setSelectedPhoto(allPhotos[0] ?? null);
    }
  };

  const renderFrame = (photo: FilmPhoto, key: string, isClone = false) => (
    <div
      key={key}
      className="filmstrip-real-frame"
      aria-hidden={isClone ? 'true' : undefined}
      onClick={() => setSelectedPhoto(photo)}
      role={isClone ? undefined : 'button'}
      tabIndex={isClone ? -1 : 0}
      aria-label={photo.title}
      onKeyDown={(e) => {
        if (!isClone && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setSelectedPhoto(photo);
        }
      }}
    >
      {/* Top Rebate with Sprocket Holes and Kodak Edge Markings */}
      <div className="filmstrip-rebate-top">
        <div className="filmstrip-sprockets" aria-hidden="true">
          {Array.from({ length: SPROCKET_COUNT }).map((_, i) => (
            <span key={i} className="filmstrip-sprocket-hole" />
          ))}
        </div>
        <div className="filmstrip-edge-meta-top">
          <span>{photo.frameNum}</span>
          <span className="filmstrip-edge-brand">KODAK PORTRA 400</span>
          <span>{photo.nextNum}</span>
        </div>
      </div>

      {/* Real Photo Aperture */}
      <div className="filmstrip-photo-aperture">
        <img
          src={photo.image}
          alt={photo.title}
          className="filmstrip-real-img"
          loading="lazy"
        />
        <div className="filmstrip-glare-overlay" />
      </div>

      {/* Bottom Rebate with Tech Metadata & Bottom Sprockets */}
      <div className="filmstrip-rebate-bottom">
        <div className="filmstrip-meta-imprint">
          <div className="filmstrip-meta-row-1">
            EXP_26 // 08-OCT // {photo.locationTag}
          </div>
          <div className="filmstrip-meta-row-2">
            <span>SCD_GUNI_2026</span>
            <span className="filmstrip-meta-play">▶</span>
            <span className="filmstrip-meta-badge">{photo.frameNum}</span>
          </div>
        </div>
        <div className="filmstrip-sprockets" aria-hidden="true">
          {Array.from({ length: SPROCKET_COUNT }).map((_, i) => (
            <span key={i} className="filmstrip-sprocket-hole" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section id={id} className="filmstrip-section">
      {/* Background Subtle Compass Drafting Circles */}
      <div className="filmstrip-bg-grid" aria-hidden="true">
        <div
          className="filmstrip-compass-circle"
          style={{ width: '420px', height: '420px', top: '-110px', right: '14%' }}
        />
        <div
          className="filmstrip-compass-circle"
          style={{ width: '280px', height: '280px', bottom: '-70px', left: '18%' }}
        />
      </div>

      {/* Clean Header */}
      {!hideHeader && (
        <div className="filmstrip-header-container">
          <div className="filmstrip-header-clean">
            <div className="filmstrip-badge">
              <span className="filmstrip-badge-icon">//</span>
              <span className="filmstrip-badge-text">GALLERY</span>
            </div>
            <h2 className="filmstrip-hero-title">
              <span className="filmstrip-title-row1">MOMENTS FROM </span>
              <span className="filmstrip-title-row2">
                OUR <span className="filmstrip-title-orange">COMMUNITY</span>
              </span>
            </h2>
          </div>
        </div>
      )}

      {/* 35mm Analog Filmstrip Carousel Reel */}
      <div className="filmstrip-reel-viewport">
        <div className="filmstrip-reel-track">
          {setA.map((photo) => renderFrame(photo, photo.uniqueKey, false))}
          {setB.map((photo) => renderFrame(photo, photo.uniqueKey, true))}
        </div>
      </div>

      {/* Interactive Lightbox Modal */}
      {lightboxItem && (
        <Lightbox
          item={lightboxItem}
          hasPrev={allPhotos.length > 1}
          hasNext={allPhotos.length > 1}
          onClose={() => setSelectedPhoto(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </section>
  );
}

export default GalleryMarqueeSection;
