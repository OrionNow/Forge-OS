-- Keep each pilot's chosen name color with their seat across server restarts.
-- The existing migration system applies this once to Neon or local PGLite.
alter table forge_members
  add column if not exists color text not null default '';
