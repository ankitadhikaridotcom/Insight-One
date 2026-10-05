-- ==============================================================================
-- Insight One Supabase Database Schema & Initial Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Employee',
    department TEXT NOT NULL DEFAULT 'General',
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    password TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure password column exists if table was previously created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;


-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    industry TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    notes TEXT,
    value TEXT DEFAULT '$25k',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    description TEXT,
    project_manager TEXT,
    assigned_team TEXT,
    start_date DATE,
    due_date DATE,
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Planning',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CONTENT TABLE (Pipeline stages following BRD)
CREATE TABLE IF NOT EXISTS public.content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_type TEXT,
    platform TEXT,
    description TEXT,
    assigned_employee TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium',
    due_date DATE,
    stage TEXT NOT NULL DEFAULT 'idea' CHECK (stage IN (
        'idea',
        'topic_approval',
        'writing',
        'review',
        'design',
        'client_approval',
        'schedule',
        'publish'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    assigned_employee TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'To Do',
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. NETWORKING TABLE
CREATE TABLE IF NOT EXISTS public.networking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    networking_type TEXT NOT NULL DEFAULT 'Call',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Connected',
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ENGAGEMENT TABLE
CREATE TABLE IF NOT EXISTS public.engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    date TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    shares INTEGER NOT NULL DEFAULT 0,
    reach INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    performance TEXT DEFAULT 'Strong',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. CALENDAR_EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'Meeting',
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. CONTENT_QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.content_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    week_start DATE,
    week_end DATE,
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all 10 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Helper to create CRUD policies for authenticated and anon users
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'profiles',
            'clients',
            'projects',
            'content',
            'tasks',
            'networking',
            'engagement',
            'calendar_events',
            'content_questions',
            'reports'
        ])
    LOOP
        -- Authenticated user policies
        EXECUTE format('DROP POLICY IF EXISTS "auth_select_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "auth_select_%s" ON public.%I FOR SELECT TO authenticated USING (true);', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "auth_insert_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "auth_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (true);', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "auth_update_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "auth_update_%s" ON public.%I FOR UPDATE TO authenticated USING (true);', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "auth_delete_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "auth_delete_%s" ON public.%I FOR DELETE TO authenticated USING (true);', tbl, tbl);

        -- Anon user policies (for client app access prior to strict auth token enforcement)
        EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "anon_select_%s" ON public.%I FOR SELECT TO anon USING (true);', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "anon_insert_%s" ON public.%I FOR INSERT TO anon WITH CHECK (true);', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "anon_update_%s" ON public.%I FOR UPDATE TO anon USING (true);', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "anon_delete_%s" ON public.%I FOR DELETE TO anon USING (true);', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- INITIAL SAMPLE DATA SEED
-- ==============================================================================

-- Seed Profiles
INSERT INTO public.profiles (full_name, email, role, department, phone, status)
VALUES
    ('Admin User', 'admin@insightone.com', 'Admin', 'Executive', '+1 (555) 019-2831', 'Active'),
    ('Employee User', 'employee@insightone.com', 'Content Strategist', 'Content', '+1 (555) 014-9923', 'Active'),
    ('Maya Chen', 'maya@insightone.ai', 'Creative Director', 'Content', '+1 (555) 392-1049', 'Active'),
    ('Alex Rivera', 'alex@insightone.ai', 'Account Manager', 'Client Success', '+1 (555) 481-9920', 'Away'),
    ('Priya Shah', 'priya@insightone.ai', 'Data Analyst', 'Insights', '+1 (555) 230-8472', 'Active'),
    ('Daniel Brooks', 'daniel@insightone.ai', 'Community Lead', 'Engagement', '+1 (555) 892-3481', 'On Leave')
ON CONFLICT (email) DO NOTHING;

-- Seed Clients
INSERT INTO public.clients (name, company, email, phone, website, industry, status, notes, value)
VALUES
    ('Emma Lawson', 'Northstar Labs', 'emma@northstarlabs.co', '+1 (555) 723-9012', 'https://northstarlabs.co', 'SaaS & AI', 'Active', 'Primary enterprise account. Renewed for annual package.', '$42k'),
    ('Carlos Mendes', 'Aster Growth', 'carlos@astergrowth.io', '+1 (555) 612-4491', 'https://astergrowth.io', 'Fintech', 'Prospect', 'In trial phase. Discussing full Q3 multi-channel rollout.', '$18k'),
    ('Sonia Patel', 'Harbor Studio', 'sonia@harborstudio.com', '+1 (555) 901-3829', 'https://harborstudio.com', 'Design & Media', 'Active', 'High volume content production with fast approvals.', '$36k'),
    ('James Wu', 'BluePeak', 'jwu@bluepeak.com', '+1 (555) 349-2018', 'https://bluepeak.com', 'Logistics', 'At Risk', 'Requires executive check-in regarding recent campaign deliverable shift.', '$27k')
ON CONFLICT DO NOTHING;

-- Seed Networking
INSERT INTO public.networking (person_name, company, email, phone, networking_type, date, status, notes, follow_up_date)
VALUES
    ('Leah Morris', 'Beacon Studio', 'leah@beaconstudio.com', '+1 (555) 819-2041', 'Coffee', '2026-05-06', 'Connected', 'Explored co-marketing partnership for creator campaigns.', '2026-05-20'),
    ('Rhett Cole', 'Summit Media', 'rhett@summitmedia.co', '+1 (555) 749-1123', 'Call', '2026-05-08', 'Follow-up', 'Discussed sponsored content opportunities and syndication.', '2026-05-15'),
    ('Sofia Lane', 'Pixel Guild', 'sofia@pixguild.io', '+1 (555) 238-9901', 'Conference', '2026-05-10', 'Planned', 'Plan to connect after keynote session regarding agency software stack.', '2026-05-25'),
    ('Marcus Vance', 'Apex Venture Capital', 'marcus@apexvc.com', '+1 (555) 438-1920', 'Partnership', '2026-05-02', 'Connected', 'Introduced portfolio companies needing content and growth advisory.', '2026-06-01')
ON CONFLICT DO NOTHING;
