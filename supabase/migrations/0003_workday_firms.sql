-- ============================================================
-- 0003_workday_firms.sql  —  Add Workday ATS slugs for Big 4
-- Run via: paste into Supabase SQL editor
-- NOTE: Workday slugs are best-guess — verify each URL works by
--   visiting: https://{tenant}.{instance}.myworkdayjobs.com/{board}
--   If a slug is wrong it will show as an error in Parser Health.
--   Fix with: UPDATE firms SET ats_company_slug = 'correct/slug' WHERE name = '...';
-- ============================================================

UPDATE firms SET ats_provider = 'workday', ats_company_slug = 'deloitte/wd1/Deloitte-Career'
  WHERE name = 'Deloitte Consulting';

UPDATE firms SET ats_provider = 'workday', ats_company_slug = 'pwc/wd3/Global'
  WHERE name = 'PwC Strategy&';

UPDATE firms SET ats_provider = 'workday', ats_company_slug = 'kpmg/wd1/KPMG-Careers'
  WHERE name = 'KPMG Advisory';

UPDATE firms SET ats_provider = 'workday', ats_company_slug = 'accenture/wd3/Accenture-Jobs'
  WHERE name = 'Accenture Strategy';
