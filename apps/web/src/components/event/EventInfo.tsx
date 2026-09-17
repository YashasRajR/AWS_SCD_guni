import { useEvent } from '../../lib/queries.js';
import { formatDate } from '../../lib/format.js';

export function EventInfo() {
  const { data: event } = useEvent();

  const dateStr = event?.eventDate ? formatDate(event.eventDate) : '8 Oct 2026';
  const venueStr = event?.venue ? 'GUNI, Mehsana' : 'GUNI, Mehsana';

  return (
    <div className="container info-strip-overlap">
      <div
        className="k"
        style={{
          background: '#fff',
          boxShadow: '0 4px 14px rgba(35, 47, 62, 0.08)',
          padding: '12px',
          borderColor: 'var(--primary)',
        }}
      >
        <div
          className="r"
          style={{
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div className="kd" style={{ flex: '1 1 140px', background: '#fff' }}>
            <p className="mo">Date</p>
            <p className="lbl" style={{ fontWeight: 700 }}>{dateStr}</p>
          </div>
          <div className="kd" style={{ flex: '1 1 140px', background: '#fff' }}>
            <p className="mo">Venue</p>
            <p className="lbl" style={{ fontWeight: 700 }}>{venueStr}</p>
          </div>
          <div className="kd" style={{ flex: '1 1 140px', background: '#fff' }}>
            <p className="mo">Mode</p>
            <p className="lbl" style={{ fontWeight: 700 }}>In person</p>
          </div>
          <div className="kd" style={{ flex: '1 1 140px', background: '#fff' }}>
            <p className="mo">Seats</p>
            <p className="lbl" style={{ fontWeight: 700, color: 'var(--primary)' }}>Limited · free</p>
          </div>
        </div>
      </div>
    </div>
  );
}
