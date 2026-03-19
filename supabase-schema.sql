-- Le Limonaie Booking System — Supabase Schema
-- Run this in the Supabase SQL editor

-- Properties
create table properties (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  address text,
  description text,
  created_at timestamptz default now()
);

-- Rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id),
  name text not null,
  description text,
  capacity int default 2,
  price_low_season numeric(10,2),
  price_mid_season numeric(10,2),
  price_high_season numeric(10,2),
  created_at timestamptz default now()
);

-- Bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id),
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  check_in date not null,
  check_out date not null,
  notes text,
  status text default 'pending', -- pending | confirmed | cancelled
  total_price numeric(10,2),
  created_at timestamptz default now()
);

-- Seed: Properties
insert into properties (slug, name, address, description) values
('centro', 'Le Limonaie in Centro', 'Via Mazzocchi, 7 — San Benedetto del Tronto (AP)', 'Affittacamere nel cuore di San Benedetto del Tronto, a 5 minuti dal mare, nella zona pedonale.'),
('countryhouse', 'Country House Le Limonaie a Mare', 'C.da Santa Lucia, 28 — San Benedetto del Tronto (AP)', 'Villa rurale immersa nel verde delle colline con splendida vista mare e piscina.');

-- Seed: Rooms for Le Limonaie in Centro
insert into rooms (property_id, name, description, capacity, price_low_season, price_mid_season, price_high_season)
select id, 'Camera dei Limoni', 'Camera matrimoniale climatizzata e insonorizzata con bagno privato. 1 letto matrimoniale.', 2, 60.00, 80.00, 100.00
from properties where slug = 'centro';

insert into rooms (property_id, name, description, capacity, price_low_season, price_mid_season, price_high_season)
select id, 'Camera dei Papaveri', 'Camera matrimoniale insonorizzata e climatizzata con terrazza affacciata sulla città e bagno privato. 1 letto matrimoniale.', 2, 60.00, 80.00, 100.00
from properties where slug = 'centro';

insert into rooms (property_id, name, description, capacity, price_low_season, price_mid_season, price_high_season)
select id, 'Suite delle Rose', 'Suite con camera da letto indipendente, soggiorno con divano letto, bagno con set di cortesia e balcone con vista città. Aria condizionata e TV. Max 3 persone.', 3, 80.00, 100.00, 130.00
from properties where slug = 'centro';

-- Seed: Country House as single bookable unit
insert into rooms (property_id, name, description, capacity, price_low_season, price_mid_season, price_high_season)
select id, 'Country House Completa', 'Villa rurale ristrutturata con piscina e vista mare. Ideale per famiglie o gruppi. Tutte le camere con vista sul mare e sulle colline marchigiane.', 8, 200.00, 280.00, 380.00
from properties where slug = 'countryhouse';

-- Enable Row Level Security (recommended for production)
-- For server-side only access via service role key, you can disable RLS or allow all for service role.
-- The app uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS automatically.

-- Optional: Enable RLS (service role key bypasses these anyway)
alter table properties enable row level security;
alter table rooms enable row level security;
alter table bookings enable row level security;

-- Allow public read on properties and rooms (for the frontend to fetch them)
create policy "Public read properties" on properties for select using (true);
create policy "Public read rooms" on rooms for select using (true);
