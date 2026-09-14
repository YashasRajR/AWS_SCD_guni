-- Removes the in-app Razorpay payment system. Registration/ticketing is
-- moving to KonfHub (handled externally); registrations.service.ts now
-- confirms a registration immediately on creation instead of waiting on a
-- payment webhook, so there is nothing left in this app that ever reads
-- or writes these tables. invoices depends on payments (fee receipts were
-- generated per payment), so it goes first.
DROP TABLE invoices;
DROP TABLE payment_events;
DROP TABLE payments;
