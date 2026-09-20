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
          padding: '8px 12px',
          borderColor: 'var(--primary)',
        }}
      >
        <div
          className="r"
          style={{
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div className="kd" style={{ flex: '1 1 120px', background: '#fff', padding: '6px 10px', gap: '2px' }}>
            <p className="mo" style={{ fontSize: '0.68rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date</p>
            <p className="lbl" style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0 }}>{dateStr}</p>
          </div>
          <div className="kd" style={{ flex: '1 1 120px', background: '#fff', padding: '6px 10px', gap: '2px' }}>
            <p className="mo" style={{ fontSize: '0.68rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Venue</p>
            <p className="lbl" style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0 }}>{venueStr}</p>
          </div>
          <div className="kd" style={{ flex: '1 1 120px', background: '#fff', padding: '6px 10px', gap: '2px' }}>
            <p className="mo" style={{ fontSize: '0.68rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mode</p>
            <p className="lbl" style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0 }}>In person</p>
          </div>
          <div className="kd" style={{ flex: '1 1 120px', background: '#fff', padding: '6px 10px', gap: '2px' }}>
            <p className="mo" style={{ fontSize: '0.68rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Seats</p>
            <p className="lbl" style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0, color: 'var(--primary)' }}>Limited · free</p>
          </div>
        </div>
      </div>
    </div>
  );
}
