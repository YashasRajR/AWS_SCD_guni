-- Many-to-many: a session can have multiple speakers, a speaker can give
-- multiple sessions.
CREATE TABLE session_speakers (
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES speakers (id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, speaker_id)
);

CREATE INDEX session_speakers_speaker_id_idx ON session_speakers (speaker_id);
