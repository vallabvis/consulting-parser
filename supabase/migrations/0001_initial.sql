-- ============================================================
-- 0001_initial.sql  —  Wisco Consulting Hub baseline schema
-- Run via: supabase db push  (or paste into Supabase SQL editor)
-- Idempotent: safe to re-run on an existing database.
-- ============================================================

-- Enable UUID helper (already on by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('member', 'officer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE firm_tier AS ENUM ('mbb', 'big4', 'tier2', 'boutique', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE role_type AS ENUM (
    'full_time', 'summer_internship', 'sophomore_program',
    'freshman_program', 'diversity_program', 'case_competition', 'networking_event'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE opportunity_status AS ENUM ('active', 'expired', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE submission_source AS ENUM (
    'manual', 'greenhouse', 'lever', 'ai_extraction', 'member_submission'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'interested', 'applied', 'oa_received', 'oa_completed',
    'first_round', 'final_round', 'offer', 'rejected', 'withdrew'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE resource_category AS ENUM (
    'case_prep', 'resume', 'behavioral', 'networking', 'firm_research', 'market_sizing'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE intro_request_status AS ENUM ('pending', 'sent', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── profiles ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  grad_year   INT,
  role        user_role NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── opportunities ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS opportunities (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_name          TEXT NOT NULL,
  firm_tier          firm_tier NOT NULL DEFAULT 'other',
  role_title         TEXT NOT NULL,
  role_type          role_type NOT NULL,
  target_grad_years  INT[] NOT NULL DEFAULT '{}',
  deadline           TIMESTAMPTZ,
  posted_date        TIMESTAMPTZ,
  location           TEXT,
  remote_eligible    BOOLEAN NOT NULL DEFAULT FALSE,
  application_url    TEXT,
  eligibility_notes  TEXT,
  application_steps  TEXT[] NOT NULL DEFAULT '{}',
  tips               TEXT,
  source_url         TEXT,
  last_verified      TIMESTAMPTZ,
  status             opportunity_status NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opportunities_updated_at ON opportunities;
CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── pending_opportunities ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pending_opportunities (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_name          TEXT NOT NULL,
  firm_tier          firm_tier NOT NULL DEFAULT 'other',
  role_title         TEXT NOT NULL,
  role_type          role_type NOT NULL,
  target_grad_years  INT[] NOT NULL DEFAULT '{}',
  deadline           TIMESTAMPTZ,
  posted_date        TIMESTAMPTZ,
  location           TEXT,
  remote_eligible    BOOLEAN NOT NULL DEFAULT FALSE,
  application_url    TEXT,
  eligibility_notes  TEXT,
  application_steps  TEXT[] NOT NULL DEFAULT '{}',
  tips               TEXT,
  source_url         TEXT,
  last_verified      TIMESTAMPTZ,
  submitted_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  submission_source  submission_source NOT NULL DEFAULT 'manual',
  reviewed_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS pending_updated_at ON pending_opportunities;
CREATE TRIGGER pending_updated_at
  BEFORE UPDATE ON pending_opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── alumni ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alumni (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name            TEXT NOT NULL,
  grad_year            INT NOT NULL,
  current_firm         TEXT NOT NULL,
  current_title        TEXT NOT NULL,
  previous_firms       TEXT[] NOT NULL DEFAULT '{}',
  linkedin_url         TEXT,
  email                TEXT,
  open_to_chat         BOOLEAN NOT NULL DEFAULT FALSE,
  areas_of_expertise   TEXT[] NOT NULL DEFAULT '{}',
  notes                TEXT,
  verified             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── resources ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resources (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  category         resource_category NOT NULL,
  url              TEXT NOT NULL,
  description      TEXT,
  recommended_by   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── user_applications ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_applications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id   UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status           application_status NOT NULL DEFAULT 'interested',
  applied_date     DATE,
  notes            TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id)
);

DROP TRIGGER IF EXISTS user_applications_updated_at ON user_applications;
CREATE TRIGGER user_applications_updated_at
  BEFORE UPDATE ON user_applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── intro_requests ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intro_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alumni_id     UUID NOT NULL REFERENCES alumni(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  status        intro_request_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni                ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE intro_requests        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own_read"   ON profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
CREATE POLICY "profiles_own_read"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "opportunities_public_read" ON opportunities;
DROP POLICY IF EXISTS "opportunities_officer_all" ON opportunities;
CREATE POLICY "opportunities_public_read" ON opportunities
  FOR SELECT USING (status = 'active');
CREATE POLICY "opportunities_officer_all" ON opportunities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer', 'admin'))
  );

DROP POLICY IF EXISTS "pending_officer_all"    ON pending_opportunities;
DROP POLICY IF EXISTS "pending_member_insert"  ON pending_opportunities;
CREATE POLICY "pending_officer_all" ON pending_opportunities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer', 'admin'))
  );
CREATE POLICY "pending_member_insert" ON pending_opportunities
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS "alumni_public_read"  ON alumni;
DROP POLICY IF EXISTS "alumni_officer_all"  ON alumni;
CREATE POLICY "alumni_public_read" ON alumni FOR SELECT USING (verified = TRUE);
CREATE POLICY "alumni_officer_all" ON alumni
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer', 'admin'))
  );

DROP POLICY IF EXISTS "resources_public_read"  ON resources;
DROP POLICY IF EXISTS "resources_officer_all"  ON resources;
CREATE POLICY "resources_public_read" ON resources FOR SELECT USING (TRUE);
CREATE POLICY "resources_officer_all" ON resources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer', 'admin'))
  );

DROP POLICY IF EXISTS "user_applications_own" ON user_applications;
CREATE POLICY "user_applications_own" ON user_applications
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "intro_requests_own"           ON intro_requests;
DROP POLICY IF EXISTS "intro_requests_officer_read"  ON intro_requests;
CREATE POLICY "intro_requests_own" ON intro_requests
  FOR ALL USING (auth.uid() = requester_id);
CREATE POLICY "intro_requests_officer_read" ON intro_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer', 'admin'))
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_opportunities_deadline   ON opportunities (deadline ASC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_opportunities_role_type  ON opportunities (role_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_opportunities_firm_tier  ON opportunities (firm_tier) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_opportunities_grad_years ON opportunities USING GIN (target_grad_years);
CREATE INDEX IF NOT EXISTS idx_user_applications_user   ON user_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_firm              ON alumni (current_firm);
CREATE INDEX IF NOT EXISTS idx_alumni_grad_year         ON alumni (grad_year);
