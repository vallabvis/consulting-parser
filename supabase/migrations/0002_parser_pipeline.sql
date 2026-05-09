-- ============================================================
-- 0002_parser_pipeline.sql  —  Parser pipeline tables + firm seed
-- Run via: supabase db push  (or paste into Supabase SQL editor)
-- Depends on: 0001_initial.sql (firm_tier enum, opportunities table)
-- ============================================================

-- ─── firms ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS firms (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL UNIQUE,
  tier             firm_tier NOT NULL DEFAULT 'other',
  careers_url      TEXT,
  ats_provider     TEXT CHECK (ats_provider IN ('greenhouse', 'lever', 'ashby', 'workday', 'custom')),
  ats_company_slug TEXT,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "firms_public_read" ON firms FOR SELECT USING (TRUE);

-- ─── Extend opportunities with parser columns ──────────────────────────────────
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS firm_id         UUID REFERENCES firms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source          TEXT CHECK (source IN (
    'tier1_scraper', 'tier2_ats', 'tier3_manual',
    'manual', 'greenhouse', 'lever', 'ai_extraction', 'member_submission'
  )),
  ADD COLUMN IF NOT EXISTS external_id     TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS source_metadata JSONB,
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS how_to_apply    TEXT;

-- Unique partial index for ATS dedup  (only enforced when both columns are set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_opp_firm_external_id
  ON opportunities(firm_id, external_id)
  WHERE firm_id IS NOT NULL AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opp_firm_id ON opportunities(firm_id) WHERE firm_id IS NOT NULL;

-- ─── parser_runs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parser_runs (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier                      TEXT NOT NULL CHECK (tier IN ('tier1', 'tier2', 'tier3')),
  started_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at              TIMESTAMPTZ,
  firms_processed           INT NOT NULL DEFAULT 0,
  opportunities_added       INT NOT NULL DEFAULT 0,
  opportunities_updated     INT NOT NULL DEFAULT 0,
  opportunities_deactivated INT NOT NULL DEFAULT 0,
  errors                    JSONB NOT NULL DEFAULT '[]'::JSONB,
  status                    TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'failed', 'partial'))
);

ALTER TABLE parser_runs ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS; authenticated officers/admins can read
CREATE POLICY "parser_runs_officer_read" ON parser_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('officer', 'admin')
    )
  );

-- ─── opportunity_submissions ──────────────────────────────────────────────────
-- Manual submissions from members; officers review before publishing
CREATE TABLE IF NOT EXISTS opportunity_submissions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_by_email TEXT NOT NULL,
  firm_name          TEXT NOT NULL,
  raw_payload        JSONB NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes     TEXT,
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE opportunity_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_officer_all" ON opportunity_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('officer', 'admin')
    )
  );

-- ─── Firms seed ───────────────────────────────────────────────────────────────
-- Tier 1 firms (no ATS): scraped via Claude
-- Tier 2 firms (ats_provider set): fetched from ATS JSON APIs
INSERT INTO firms (name, tier, careers_url, ats_provider, ats_company_slug) VALUES
  ('McKinsey & Company',            'mbb',      'https://www.mckinsey.com/careers/students',                                        NULL,         NULL),
  ('Boston Consulting Group',       'mbb',      'https://careers.bcg.com/students',                                                 NULL,         NULL),
  ('Bain & Company',                'mbb',      'https://www.bain.com/careers/find-a-role/',                                        'greenhouse', 'bain'),
  ('Deloitte Consulting',           'big4',     'https://www2.deloitte.com/us/en/pages/careers/articles/join-deloitte-us.html',      NULL,         NULL),
  ('EY-Parthenon',                  'big4',     'https://careers.ey.com/ey/jobs',                                                   NULL,         NULL),
  ('PwC Strategy&',                 'big4',     'https://www.pwc.com/us/en/careers/campus-recruiting.html',                         NULL,         NULL),
  ('KPMG Advisory',                 'big4',     'https://home.kpmg/us/en/home/careers.html',                                        NULL,         NULL),
  ('Accenture Strategy',            'big4',     'https://www.accenture.com/us-en/careers',                                          NULL,         NULL),
  ('LEK Consulting',                'tier2',    'https://www.lek.com/join-us/students',                                             NULL,         NULL),
  ('Oliver Wyman',                  'tier2',    'https://careers.oliverwyman.com',                                                  NULL,         NULL),
  ('Kearney',                       'tier2',    'https://www.kearney.com/careers',                                                  NULL,         NULL),
  ('Roland Berger',                 'tier2',    'https://www.rolandberger.com/en/Join/Student-Careers.html',                        NULL,         NULL),
  ('ZS Associates',                 'tier2',    'https://www.zs.com/careers',                                                       'greenhouse', 'zsassociates'),
  ('West Monroe',                   'boutique', 'https://www.westmonroe.com/careers',                                               NULL,         NULL),
  ('Huron Consulting',              'boutique', 'https://www.huronconsultinggroup.com/careers',                                     NULL,         NULL),
  ('Slalom',                        'boutique', 'https://www.slalom.com/us/en/careers',                                             NULL,         NULL),
  ('Cognizant',                     'other',    'https://careers.cognizant.com',                                                    NULL,         NULL),
  ('Capgemini Invent',              'other',    'https://www.capgemini.com/us-en/careers/',                                         NULL,         NULL),
  ('BCG Platinion',                 'mbb',      'https://www.bcgplatinion.com/careers/',                                            NULL,         NULL),
  ('Alvarez & Marsal',              'boutique', 'https://www.alvarezandmarsal.com/careers',                                        'lever',      'alvarezandmarsal'),
  ('AlixPartners',                  'boutique', 'https://www.alixpartners.com/careers/',                                            NULL,         NULL),
  ('FTI Consulting',                'boutique', 'https://www.fticonsulting.com/careers',                                            NULL,         NULL),
  ('Charles River Associates',      'boutique', 'https://www.crai.com/join-us/',                                                    'greenhouse', 'charlesriverassociates'),
  ('Analysis Group',                'tier2',    'https://www.analysisgroup.com/careers/',                                           'greenhouse', 'analysisgroup'),
  ('Cornerstone Research',          'tier2',    'https://www.cornerstone.com/careers/',                                             'greenhouse', 'cornerstoneresearch'),
  ('Putnam Associates',             'tier2',    'https://www.putassoc.com/careers',                                                 'greenhouse', 'putnamassociates'),
  ('Trinity Life Sciences',         'boutique', 'https://www.trinitylifesciences.com/careers/',                                     NULL,         NULL),
  ('Clearview Healthcare Partners', 'boutique', 'https://www.clearviewhealthcare.com/careers/',                                     NULL,         NULL),
  ('Simon-Kucher',                  'tier2',    'https://www.simon-kucher.com/en/careers',                                          NULL,         NULL),
  ('Accenture Federal Services',    'other',    'https://www.accenturefederal.com/careers',                                         NULL,         NULL)
ON CONFLICT (name) DO UPDATE SET
  tier             = EXCLUDED.tier,
  careers_url      = EXCLUDED.careers_url,
  ats_provider     = EXCLUDED.ats_provider,
  ats_company_slug = EXCLUDED.ats_company_slug,
  active           = EXCLUDED.active;
