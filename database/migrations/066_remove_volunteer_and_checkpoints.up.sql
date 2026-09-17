-- Removes the volunteer portal and its checkpoint/check-in system
-- entirely. qr_scan_logs was the scan-resolution log for the
-- volunteer-run checkpoint scanner (distinct from qr_tokens itself, which
-- stays -- ticket issuance/rotation has no dependency on volunteers). It
-- references volunteers/checkpoints/attendees so it goes first, then
-- checkpoint_attendance and volunteer_checkpoint_assignments (both
-- reference checkpoints and/or volunteers), then checkpoints and
-- volunteers themselves.
DROP TABLE qr_scan_logs;
DROP TABLE checkpoint_attendance;
DROP TABLE volunteer_checkpoint_assignments;
DROP TABLE checkpoints;
DROP TABLE volunteers;
