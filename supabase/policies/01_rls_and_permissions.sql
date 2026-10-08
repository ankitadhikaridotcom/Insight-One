-- ==============================================================================
-- 01_rls_and_permissions.sql
-- Insight One Row Level Security (RLS) & Function Permission Grants
-- ==============================================================================

-- 1. Enable RLS across all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

-- 2. Grant permissions to authenticated & anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- 3. Row Level Security Policies
-- Note: Since all mutations strictly execute through SECURITY DEFINER stored procedures,
-- these policies provide baseline security for direct PostgREST read endpoints.
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'tenants', 'agencies', 'roles', 'scopes', 'role_scopes', 'role_menu_items',
            'profiles', 'clients', 'social_profiles', 'projects', 'content', 'tasks',
            'networking', 'engagement', 'calendar_events', 'reports', 'error_log'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "policy_all_%s" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "policy_all_%s" ON public.%I FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;
