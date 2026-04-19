-- ============================================================
-- seed.sql  —  Sample data for local dev / demo
-- Run AFTER migrations: supabase db reset  (runs migrations + seed)
-- ============================================================

-- ─── Opportunities ────────────────────────────────────────────────────────────

INSERT INTO opportunities (
  firm_name, firm_tier, role_title, role_type, target_grad_years,
  deadline, location, remote_eligible, application_url,
  eligibility_notes, application_steps, tips, status
) VALUES

-- ── MBB Summer Internships (target 2027 — juniors) ──────────────────────────

('McKinsey & Company', 'mbb', 'Business Analyst Summer Intern 2026', 'summer_internship',
 '{2027}', '2026-01-15 23:59:00+00', 'Multiple US offices', FALSE,
 'https://www.mckinsey.com/careers/students',
 'Must be graduating in 2027. All majors welcome.',
 ARRAY['Submit resume + unofficial transcript via portal',
       'Complete McKinsey Problem Solving Game (Imbellus)',
       'First-round interview (1 case + PEI)',
       'Final-round interview (2 cases at office)'],
 'The Problem Solving Game is adaptive — focus on accuracy over speed. Practice case cracking via McKinsey''s official prep materials.',
 'active'),

('Boston Consulting Group', 'mbb', 'Associate Summer Intern 2026', 'summer_internship',
 '{2027}', '2026-01-31 23:59:00+00', 'Multiple US offices', FALSE,
 'https://careers.bcg.com/students',
 'Must be graduating in 2027.',
 ARRAY['Online application with resume + cover letter',
       'BCG Potential Test (online assessment)',
       'First-round interview (1-2 cases)',
       'Second-round interview at office (2 cases + fit)'],
 'BCG cases tend to be more open-ended than McKinsey. Emphasize your hypothesis-driven structure.',
 'active'),

('Bain & Company', 'mbb', 'Associate Consultant Intern 2026', 'summer_internship',
 '{2027}', '2026-02-01 23:59:00+00', 'Multiple US offices', FALSE,
 'https://www.bain.com/careers/find-a-role/',
 'Must be graduating in 2027. Bain recruits heavily from target schools.',
 ARRAY['Resume drop + cover letter',
       'First-round: 2 case interviews (30 min each)',
       'Super Day: 4 interviews (3 case + 1 fit) at office'],
 'Bain cases often start with a broad business problem. Lead with the so-what, not the framework.',
 'active'),

-- ── MBB Sophomore Programs (target 2028 — sophomores) ───────────────────────

('McKinsey & Company', 'mbb', 'McKinsey Sophomore Summer Program', 'sophomore_program',
 '{2028}', '2026-02-28 23:59:00+00', 'Multiple US offices', FALSE,
 'https://www.mckinsey.com/careers/students/sophomore-program',
 'Current sophomores (class of 2028). Leadership + academic excellence required.',
 ARRAY['Online application: resume, transcript, short essays',
       'Video interview or phone screen',
       'Final-round office interviews (case + fit)'],
 'Essays are crucial — show leadership impact with specific metrics, not vague involvement.',
 'active'),

('Boston Consulting Group', 'mbb', 'BCG Sophomore Program', 'sophomore_program',
 '{2028}', '2026-03-15 23:59:00+00', 'Multiple US offices', FALSE,
 'https://careers.bcg.com/students',
 'Open to current sophomores graduating in 2028.',
 ARRAY['Application via BCG careers portal',
       'Online case-based assessment',
       'Interview rounds (varies by office)'],
 'This is a great way to get a McKinsey/BCG internship a year before most peers. Apply even if you feel under-prepared.',
 'active'),

-- ── MBB Diversity & Inclusion Programs (target 2028/2029) ───────────────────

('McKinsey & Company', 'mbb', 'McKinsey Achievement Program (MAP)', 'diversity_program',
 '{2028, 2029}', '2026-03-01 23:59:00+00', 'Multiple US offices', FALSE,
 'https://www.mckinsey.com/careers/students/map',
 'For students from underrepresented backgrounds. Freshmen and sophomores.',
 ARRAY['Online application with essays',
       'Phone or video interview',
       'Invitation to MAP summit (2-day immersive event)'],
 'MAP is a pipeline program — summit attendees are fast-tracked for future internship interviews.',
 'active'),

('Boston Consulting Group', 'mbb', 'Bridge to BCG', 'diversity_program',
 '{2028, 2029}', '2026-02-15 23:59:00+00', 'Multiple US offices', FALSE,
 'https://careers.bcg.com/diversity',
 'For first-generation college students and underrepresented minorities. Open to freshmen/sophomores.',
 ARRAY['Submit application + short essays',
       'Video interview (case + behavioral)',
       'Multi-day immersion program at BCG office'],
 'Even if you don''t receive an offer, completing the Bridge program puts you on BCG''s radar for junior-year recruiting.',
 'active'),

('Bain & Company', 'mbb', 'Building Entrepreneurial Leaders (BEL)', 'diversity_program',
 '{2028, 2029}', '2026-02-20 23:59:00+00', 'Multiple US offices', FALSE,
 'https://www.bain.com/careers/students/building-entrepreneurial-leaders/',
 'For first-gen and underrepresented students. Freshmen and sophomores preferred.',
 ARRAY['Application: resume + 2 short essays',
       'Phone screen with recruiter',
       'Case interview prep workshop (invited candidates)',
       'Final interview round'],
 'BEL has a strong emphasis on entrepreneurial thinking — bring examples of initiative and creative problem-solving.',
 'active'),

-- ── Big 4 Strategy Roles ─────────────────────────────────────────────────────

('Deloitte', 'big4', 'Strategy & Analytics Summer Scholar', 'summer_internship',
 '{2027}', '2026-03-31 23:59:00+00', 'Chicago, IL / New York, NY', FALSE,
 'https://www2.deloitte.com/us/en/pages/careers/articles/join-deloitte-us.html',
 'Must be graduating in 2027. Deloitte S&O focuses on strategy and operations.',
 ARRAY['Apply via Deloitte campus portal',
       'HireVue video interview',
       'Office interview (case + fit)'],
 'Deloitte cases often have an implementation angle — don''t just diagnose the problem, discuss how you''d execute the solution.',
 'active'),

('EY-Parthenon', 'big4', 'Summer Intern – Strategy', 'summer_internship',
 '{2027}', '2026-03-15 23:59:00+00', 'New York, NY / Chicago, IL', FALSE,
 'https://careers.ey.com/ey/jobs',
 'EY-Parthenon is EY''s strategy arm — separate from audit/tax. Must be graduating 2027.',
 ARRAY['Submit application on EY careers site',
       'Online aptitude assessment',
       'First-round video interviews',
       'Super Day at office'],
 'EY-P has a strong PE/deals advisory practice — if you''re interested in private equity, highlight any relevant coursework or projects.',
 'active'),

('PwC / Strategy&', 'big4', 'Strategy& Summer Associate', 'summer_internship',
 '{2027}', '2026-04-01 23:59:00+00', 'New York, NY / Dallas, TX', FALSE,
 'https://www.pwc.com/us/en/careers/campus-recruiting.html',
 'Strategy& is PwC''s strategy consulting division. Must be graduating 2027.',
 ARRAY['Apply via PwC campus portal',
       'Recruiter phone screen',
       'Case interview round (2 cases)',
       'Final in-person interviews'],
 'Strategy& emphasizes sector expertise — if you have a clear industry interest (healthcare, tech, energy), lead with it.',
 'active'),

-- ── Tier-2 Firms ─────────────────────────────────────────────────────────────

('Oliver Wyman', 'tier2', 'Summer Analyst Intern 2026', 'summer_internship',
 '{2027}', '2026-02-28 23:59:00+00', 'New York, NY / Chicago, IL', FALSE,
 'https://careers.oliverwyman.com',
 'Must be graduating 2027. OW is strong in financial services and insurance.',
 ARRAY['Online application + resume',
       'Written case / online assessment',
       'Two rounds of case interviews'],
 'OW cases lean heavily quantitative, especially for financial-services projects. Brush up on financial modeling concepts.',
 'active'),

('L.E.K. Consulting', 'tier2', 'Summer Associate Intern 2026', 'summer_internship',
 '{2027}', '2026-03-01 23:59:00+00', 'Boston, MA / Chicago, IL', FALSE,
 'https://www.lek.com/join-us/students',
 'Graduating 2027. L.E.K. is known for PE due diligence and life sciences.',
 ARRAY['Submit resume through LEK portal',
       'Phone screen with analyst/associate',
       'First-round case interviews (2)',
       'Final-round office visit (2-3 cases)'],
 'L.E.K. cases frequently involve market sizing and competitive benchmarking — master these archetypes.',
 'active'),

('Kearney', 'tier2', 'Associate Intern – Summer 2026', 'summer_internship',
 '{2027}', '2026-03-15 23:59:00+00', 'Chicago, IL', FALSE,
 'https://www.kearney.com/careers',
 'Must be graduating 2027. Kearney is strong in operations and supply chain.',
 ARRAY['Online application',
       'Video interview (behavioral + mini-case)',
       'Final round: 2-3 case interviews at office'],
 'Kearney loves operational cases — think supply chain optimization, cost reduction, and manufacturing footprint.',
 'active'),

('ZS Associates', 'tier2', 'Business Operations Associate Intern', 'summer_internship',
 '{2027}', '2026-02-15 23:59:00+00', 'Evanston, IL / Philadelphia, PA', FALSE,
 'https://www.zs.com/careers',
 'Graduating 2027. ZS focuses on pharma/healthcare and sales force effectiveness.',
 ARRAY['Apply on ZS careers portal',
       'HackerRank coding/analytics assessment',
       'Case + behavioral interviews (2 rounds)'],
 'ZS uses Excel/SQL heavily — highlight any data analysis coursework. Many UW-Madison grads end up here.',
 'active'),

('Putnam Associates', 'tier2', 'Analyst Intern – Summer 2026', 'summer_internship',
 '{2027}', '2026-03-01 23:59:00+00', 'Burlington, MA', FALSE,
 'https://www.putassoc.com/careers',
 'Must be graduating 2027. Putnam is exclusively pharma/biotech strategy.',
 ARRAY['Submit resume + cover letter',
       'Phone screen',
       'Case interview (pharma strategy context)'],
 'All Putnam cases are in pharma. If you''ve taken biochem or have healthcare interest, lead with that.',
 'active'),

-- ── Case Competitions ─────────────────────────────────────────────────────────

('Darden School of Business – UVA', 'other', 'Darden National Case Competition', 'case_competition',
 '{2026, 2027, 2028, 2029}', '2026-09-15 23:59:00+00', 'Charlottesville, VA', FALSE,
 'https://www.darden.virginia.edu/events',
 'Open to all undergrads. Teams of 4. No prior case experience required.',
 ARRAY['Form a team of 4 undergraduates',
       'Submit team registration form by deadline',
       'Receive case packet 24 hours before presentation',
       'Present 20-min solution + 10-min Q&A to panel of consultants'],
 'Judges love a crisp storyline. Start with the answer, then prove it. Practice under time pressure.',
 'active'),

('Ross School of Business – UMich', 'other', 'Michigan Business Challenge (Consulting Track)', 'case_competition',
 '{2026, 2027, 2028, 2029}', '2026-10-01 23:59:00+00', 'Ann Arbor, MI', FALSE,
 'https://michiganrossbizchallenge.com',
 'Open to all undergrads at Big Ten schools. Teams of 2-4.',
 ARRAY['Team registration + abstract submission',
       'Virtual qualifying round (written case)',
       'Semi-final and final rounds at Ross'],
 'Consulting track cases focus on a real company. Research the client before the day — you can prepare industry context.',
 'active'),

('Boston Consulting Group', 'mbb', 'BCG Strategy Challenge (Campus)', 'case_competition',
 '{2026, 2027, 2028, 2029}', '2026-11-01 23:59:00+00', 'Remote / Various', TRUE,
 'https://www.bcg.com/beyond-consulting/bcg-rise/strategy-challenge',
 'BCG-run case competition open to all undergrads globally. Individual or team.',
 ARRAY['Register on BCG platform',
       'Complete online strategy challenge modules',
       'Top performers invited to final rounds with BCG consultants'],
 'Winning or placing well here can substitute for part of BCG''s normal interview process.',
 'active'),

-- ── Boutique Firms ────────────────────────────────────────────────────────────

('Huron Consulting Group', 'boutique', 'Summer Analyst – Healthcare & Life Sciences', 'summer_internship',
 '{2027}', '2026-04-15 23:59:00+00', 'Chicago, IL', FALSE,
 'https://www.huronconsultinggroup.com/careers',
 'Graduating 2027. Huron focuses on healthcare, higher education, and life sciences.',
 ARRAY['Apply on Huron careers site',
       'Recruiter phone screen',
       'Case interview round (healthcare context)'],
 'Huron interviews are less intense than MBB — focus on fit and genuine interest in healthcare operations.',
 'active'),

('West Monroe Partners', 'boutique', 'Summer Analyst 2026', 'summer_internship',
 '{2027}', '2026-04-30 23:59:00+00', 'Chicago, IL', FALSE,
 'https://www.westmonroe.com/careers',
 'Graduating 2027. West Monroe blends strategy and technology implementation.',
 ARRAY['Apply via West Monroe careers portal',
       'HireVue behavioral interview',
       'Case + technical interview (Excel/data)'],
 'West Monroe bridges consulting and tech — if you code or have done data analysis projects, bring examples.',
 'active');

-- ─── Alumni ────────────────────────────────────────────────────────────────────

INSERT INTO alumni (
  full_name, grad_year, current_firm, current_title, previous_firms,
  linkedin_url, open_to_chat, areas_of_expertise, verified
) VALUES

('Sarah Chen', 2018, 'McKinsey & Company', 'Engagement Manager',
 ARRAY['BCG (Intern 2017)'],
 'https://linkedin.com/in/sarah-chen-uw', TRUE,
 ARRAY['healthcare', 'strategy', 'recruiting advice', 'MBB interviews'],
 TRUE),

('Marcus Williams', 2019, 'Bain & Company', 'Case Team Leader',
 ARRAY['Deloitte S&O (Summer 2018)'],
 'https://linkedin.com/in/marcus-williams-bain', TRUE,
 ARRAY['private equity', 'consumer goods', 'case prep', 'Wisconsin recruiting'],
 TRUE),

('Priya Patel', 2020, 'Boston Consulting Group', 'Project Leader',
 ARRAY['ZS Associates (2020-2021)'],
 'https://linkedin.com/in/priya-patel-bcg', FALSE,
 ARRAY['pharma', 'go-to-market strategy', 'life sciences'],
 TRUE),

('Jordan Lee', 2021, 'Deloitte Consulting', 'Senior Consultant – S&O',
 ARRAY[''],
 'https://linkedin.com/in/jordan-lee-deloitte', TRUE,
 ARRAY['operations', 'supply chain', 'technology transformation', 'Big 4 vs MBB decision'],
 TRUE),

('Aisha Thompson', 2022, 'Oliver Wyman', 'Consultant',
 ARRAY[''],
 'https://linkedin.com/in/aisha-thompson-ow', TRUE,
 ARRAY['financial services', 'insurance', 'case prep', 'diversity recruiting'],
 TRUE),

('Derek Nguyen', 2022, 'Amazon', 'Senior Product Manager',
 ARRAY['McKinsey & Company (2022-2024)'],
 'https://linkedin.com/in/derek-nguyen-pm', TRUE,
 ARRAY['post-consulting careers', 'tech', 'product management', 'exit opportunities'],
 TRUE),

('Fatima Al-Hassan', 2023, 'EY-Parthenon', 'Analyst',
 ARRAY[''],
 'https://linkedin.com/in/fatima-alhassan-eyp', TRUE,
 ARRAY['deals advisory', 'private equity due diligence', 'first-year consulting life'],
 TRUE),

('Ryan Kowalski', 2024, 'ZS Associates', 'Business Operations Associate',
 ARRAY[''],
 'https://linkedin.com/in/ryan-kowalski-zs', TRUE,
 ARRAY['pharma consulting', 'ZS recruiting', 'Madison to consulting', 'data analytics'],
 TRUE);

-- ─── Resources ────────────────────────────────────────────────────────────────

INSERT INTO resources (title, category, url, description, recommended_by) VALUES

('Case in Point (Cosentino)', 'case_prep',
 'https://www.amazon.com/Case-Point-Complete-Interview-Preparation/dp/0986370711',
 'The most widely used case prep book. Dense but comprehensive. Read chapters 1-4 first.', 'Club Officers'),

('Victor Cheng – Look Over My Shoulder (LOMS)', 'case_prep',
 'https://www.caseinterview.com/loms',
 '20 live case recordings with feedback. Invaluable for hearing what good sounds like.', 'Marcus Williams (Bain ''19)'),

('MConsultingPrep – Full Case Library', 'case_prep',
 'https://mconsultingprep.com/case-interview',
 'Free and paid case libraries with structured frameworks. Good supplement to LOMS.', 'Club Officers'),

('Management Consulted – Case Interview Prep Blog', 'case_prep',
 'https://managementconsulted.com/case-interview',
 'Articles covering every framework, firm-specific tips, and salary data.', 'Club Officers'),

('McKinsey Official Case Prep', 'case_prep',
 'https://www.mckinsey.com/careers/interviewing',
 'Official interactive cases and the Problem Solving Game demo from McKinsey. Free.', 'Club Officers'),

('BCG Official Case Prep', 'case_prep',
 'https://careers.bcg.com/case-prep',
 'BCG''s own case library including the Chatbot Interview simulation. Free.', 'Club Officers'),

('PrepLounge Community Cases', 'case_prep',
 'https://www.preplounge.com/en/consulting-forum',
 'Peer-to-peer case library with 1000+ cases. Best for finding practice partners.', 'Sarah Chen (McKinsey ''18)'),

('Wisconsin School of Business – Career Resources', 'networking',
 'https://bus.wisc.edu/career-center',
 'WSB career center has firm-specific recruiting timelines and alumni coffee chat guides.', 'Club Officers'),

('Consulting.com – Resume & Cover Letter Templates', 'resume',
 'https://www.consulting.com/consulting-resume',
 'Annotated resume examples that actually got people into MBB. Worth the 20 minutes.', 'Club Officers'),

('Firm Research Cheat Sheet – Management Consulted', 'firm_research',
 'https://managementconsulted.com/consulting-firms',
 'Side-by-side firm comparisons: culture, pay, exit opps, case style. Use before interviews.', 'Jordan Lee (Deloitte ''21)'),

('Market Sizing Workbook – MConsultingPrep', 'market_sizing',
 'https://mconsultingprep.com/market-sizing',
 '30 market sizing practice problems with worked solutions. Great for quick prep sprints.', 'Club Officers'),

('Behavioral Interview STAR Bank Template', 'behavioral',
 'https://managementconsulted.com/case-interview/personal-experience-interview',
 'PEI (Personal Experience Interview) guide for Bain/BCG. Build 6-8 stories before any interview.', 'Aisha Thompson (Oliver Wyman ''22)');
