-- Shared sortie rooms. Rows are unowned: the room code and member token are the
-- capability. No accounts. Callsigns are table handles, not account identities.
create table if not exists forge_rooms (
  code text primary key,
  host_token text not null,
  revision bigint not null default 0,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists forge_members (
  room_code text not null references forge_rooms (code) on delete cascade,
  member_id text not null,
  token text not null,
  callsign text not null,
  role text not null,
  last_seen timestamptz not null default now(),
  primary key (room_code, member_id)
);

create index if not exists forge_members_room_idx on forge_members (room_code, last_seen);
