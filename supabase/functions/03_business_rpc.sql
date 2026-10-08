-- ==============================================================================
-- 03_business_rpc.sql
-- Insight One Business RPC Functions (Security Definer, p_ Params, JSONB Results)
-- ==============================================================================

-- ==============================================================================
-- MODULE 1: AGENCIES & CLIENTS
-- ==============================================================================

-- fn_agencies_list
CREATE OR REPLACE FUNCTION public.fn_agencies_list()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_agencies JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_agencies_list');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_agencies_list', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'code', a.code,
            'name', a.name,
            'description', a.description,
            'created_at', a.created_at
        ) ORDER BY a.id ASC
    )
    INTO v_agencies
    FROM public.agencies a
    WHERE a.tenant_id = v_tenant_id AND a.is_active = true;

    RETURN public.fn_response_success(COALESCE(v_agencies, '[]'::jsonb), NULL, 'Agencies retrieved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_agencies_list', SQLSTATE, 'Failed to fetch agencies', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_clients_list
CREATE OR REPLACE FUNCTION public.fn_clients_list(
    p_agency_id INTEGER DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_clients JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_clients_list');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_clients_list', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'agency_id', c.agency_id,
            'code', c.code,
            'name', c.name,
            'company', c.company,
            'email', c.email,
            'phone', c.phone,
            'website', c.website,
            'industry', c.industry,
            'status', c.status,
            'value', c.value,
            'notes', c.notes,
            'created_at', c.created_at,
            'updated_at', c.updated_at
        ) ORDER BY c.id DESC
    )
    INTO v_clients
    FROM public.clients c
    WHERE c.tenant_id = v_tenant_id
      AND c.is_active = true
      AND (p_agency_id IS NULL OR c.agency_id = p_agency_id)
      AND (p_status IS NULL OR p_status = 'ALL' OR c.status = p_status)
      AND (p_search IS NULL OR c.name ILIKE '%' || p_search || '%' OR c.company ILIKE '%' || p_search || '%');

    RETURN public.fn_response_success(COALESCE(v_clients, '[]'::jsonb), NULL, 'Clients retrieved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_clients_list', SQLSTATE, 'Failed to fetch clients', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_client_upsert
CREATE OR REPLACE FUNCTION public.fn_client_upsert(
    p_id INTEGER DEFAULT NULL,
    p_agency_id INTEGER DEFAULT NULL,
    p_code TEXT DEFAULT NULL,
    p_name TEXT DEFAULT NULL,
    p_company TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'Active',
    p_value TEXT DEFAULT '$25k',
    p_notes TEXT DEFAULT NULL,
    p_data JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
    v_code TEXT;
    v_client JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_client_upsert');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_client_upsert', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;
    v_code := COALESCE(p_code, 'CLI-' || floor(random() * 9000 + 1000)::text);

    IF p_id IS NOT NULL THEN
        UPDATE public.clients
        SET agency_id = COALESCE(p_agency_id, agency_id),
            name = COALESCE(p_name, name),
            company = COALESCE(p_company, company),
            email = COALESCE(p_email, email),
            phone = COALESCE(p_phone, phone),
            website = COALESCE(p_website, website),
            industry = COALESCE(p_industry, industry),
            status = COALESCE(p_status, status),
            value = COALESCE(p_value, value),
            notes = COALESCE(p_notes, notes),
            data = COALESCE(p_data, data),
            metadata = COALESCE(p_metadata, metadata),
            updated_by = v_profile_id,
            updated_at = now()
        WHERE id = p_id AND tenant_id = v_tenant_id
        RETURNING to_jsonb(clients.*) INTO v_client;
    ELSE
        INSERT INTO public.clients (
            agency_id, code, name, company, email, phone, website, industry,
            status, value, notes, data, metadata, tenant_id, created_by, updated_by
        ) VALUES (
            p_agency_id, v_code, p_name, p_company, p_email, p_phone, p_website, p_industry,
            p_status, p_value, p_notes, p_data, p_metadata, v_tenant_id, v_profile_id, v_profile_id
        )
        RETURNING to_jsonb(clients.*) INTO v_client;
    END IF;

    RETURN public.fn_response_success(v_client, NULL, 'Client saved successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_client_upsert', SQLSTATE, 'Failed to save client', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_client_delete
CREATE OR REPLACE FUNCTION public.fn_client_delete(
    p_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
BEGIN
    v_ctx := public.fn_get_request_context('fn_client_delete');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_client_delete', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;

    UPDATE public.clients
    SET is_active = false, updated_by = v_profile_id, updated_at = now()
    WHERE id = p_id AND tenant_id = v_tenant_id;

    RETURN public.fn_response_success(jsonb_build_object('id', p_id), NULL, 'Client deactivated successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_client_delete', SQLSTATE, 'Failed to delete client', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_social_profiles_list
CREATE OR REPLACE FUNCTION public.fn_social_profiles_list(
    p_client_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profiles JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_social_profiles_list');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_social_profiles_list', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', sp.id,
            'client_id', sp.client_id,
            'code', sp.code,
            'platform', sp.platform,
            'handle', sp.handle,
            'profile_url', sp.profile_url,
            'followers_count', sp.followers_count,
            'created_at', sp.created_at
        ) ORDER BY sp.id ASC
    )
    INTO v_profiles
    FROM public.social_profiles sp
    WHERE sp.tenant_id = v_tenant_id AND sp.client_id = p_client_id AND sp.is_active = true;

    RETURN public.fn_response_success(COALESCE(v_profiles, '[]'::jsonb), NULL, 'Social profiles retrieved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_social_profiles_list', SQLSTATE, 'Failed to fetch social profiles', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- ==============================================================================
-- MODULE 2: PROJECTS (KANBAN BOARD)
-- ==============================================================================

-- fn_projects_list
CREATE OR REPLACE FUNCTION public.fn_projects_list(
    p_client_id INTEGER DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_projects JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_projects_list');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_projects_list', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'client_id', p.client_id,
            'client', COALESCE(c.company, c.name, 'Internal'),
            'code', p.code,
            'name', p.name,
            'description', p.description,
            'project_manager', p.project_manager,
            'manager', p.project_manager,
            'assigned_team', p.assigned_team,
            'assignedTeam', p.assigned_team,
            'start_date', p.start_date,
            'startDate', p.start_date,
            'due_date', p.due_date,
            'dueDate', p.due_date,
            'priority', p.priority,
            'status', p.status,
            'progress', p.progress,
            'created_at', p.created_at
        ) ORDER BY p.id DESC
    )
    INTO v_projects
    FROM public.projects p
    LEFT JOIN public.clients c ON c.id = p.client_id
    WHERE p.tenant_id = v_tenant_id
      AND p.is_active = true
      AND (p_client_id IS NULL OR p.client_id = p_client_id)
      AND (p_status IS NULL OR p_status = 'ALL' OR p.status = p_status)
      AND (p_priority IS NULL OR p_priority = 'ALL' OR p.priority = p_priority)
      AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%' OR p.description ILIKE '%' || p_search || '%');

    RETURN public.fn_response_success(COALESCE(v_projects, '[]'::jsonb), NULL, 'Projects retrieved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_projects_list', SQLSTATE, 'Failed to fetch projects', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_project_upsert
CREATE OR REPLACE FUNCTION public.fn_project_upsert(
    p_id INTEGER DEFAULT NULL,
    p_client_id INTEGER DEFAULT NULL,
    p_code TEXT DEFAULT NULL,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_project_manager TEXT DEFAULT NULL,
    p_assigned_team TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_due_date DATE DEFAULT NULL,
    p_priority TEXT DEFAULT 'Medium',
    p_status TEXT DEFAULT 'Planning',
    p_progress INTEGER DEFAULT 0,
    p_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
    v_code TEXT;
    v_project JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_project_upsert');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_project_upsert', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;
    v_code := COALESCE(p_code, 'PRJ-' || floor(random() * 9000 + 1000)::text);

    IF p_id IS NOT NULL THEN
        UPDATE public.projects
        SET client_id = COALESCE(p_client_id, client_id),
            name = COALESCE(p_name, name),
            description = COALESCE(p_description, description),
            project_manager = COALESCE(p_project_manager, project_manager),
            assigned_team = COALESCE(p_assigned_team, assigned_team),
            start_date = COALESCE(p_start_date, start_date),
            due_date = COALESCE(p_due_date, due_date),
            priority = COALESCE(p_priority, priority),
            status = COALESCE(p_status, status),
            progress = COALESCE(p_progress, progress),
            data = COALESCE(p_data, data),
            updated_by = v_profile_id,
            updated_at = now()
        WHERE id = p_id AND tenant_id = v_tenant_id
        RETURNING to_jsonb(projects.*) INTO v_project;
    ELSE
        INSERT INTO public.projects (
            client_id, code, name, description, project_manager, assigned_team,
            start_date, due_date, priority, status, progress, data,
            tenant_id, created_by, updated_by
        ) VALUES (
            p_client_id, v_code, p_name, p_description, p_project_manager, p_assigned_team,
            p_start_date, p_due_date, p_priority, p_status, p_progress, p_data,
            v_tenant_id, v_profile_id, v_profile_id
        )
        RETURNING to_jsonb(projects.*) INTO v_project;
    END IF;

    RETURN public.fn_response_success(v_project, NULL, 'Project saved successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_project_upsert', SQLSTATE, 'Failed to save project', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_project_status_update (Instant Kanban dragging)
CREATE OR REPLACE FUNCTION public.fn_project_status_update(
    p_id INTEGER,
    p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
BEGIN
    v_ctx := public.fn_get_request_context('fn_project_status_update');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_project_status_update', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;

    UPDATE public.projects
    SET status = p_status,
        updated_by = v_profile_id,
        updated_at = now()
    WHERE id = p_id AND tenant_id = v_tenant_id;

    RETURN public.fn_response_success(jsonb_build_object('id', p_id, 'status', p_status), NULL, 'Project status updated');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_project_status_update', SQLSTATE, 'Failed to update project status', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_project_delete
CREATE OR REPLACE FUNCTION public.fn_project_delete(
    p_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
BEGIN
    v_ctx := public.fn_get_request_context('fn_project_delete');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_project_delete', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;

    UPDATE public.projects
    SET is_active = false, updated_by = v_profile_id, updated_at = now()
    WHERE id = p_id AND tenant_id = v_tenant_id;

    RETURN public.fn_response_success(jsonb_build_object('id', p_id), NULL, 'Project deleted successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_project_delete', SQLSTATE, 'Failed to delete project', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- ==============================================================================
-- MODULE 3: CONTENT PIPELINE (KANBAN BOARD)
-- ==============================================================================

-- fn_content_list
CREATE OR REPLACE FUNCTION public.fn_content_list(
    p_client_id INTEGER DEFAULT NULL,
    p_stage TEXT DEFAULT NULL,
    p_platform TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_content JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_content_list');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_content_list', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', cnt.id,
            'client_id', cnt.client_id,
            'client', COALESCE(c.company, c.name, 'Internal'),
            'code', cnt.code,
            'title', cnt.title,
            'content_type', cnt.content_type,
            'platform', cnt.platform,
            'description', cnt.description,
            'assigned_employee', cnt.assigned_employee,
            'assignedEmployee', cnt.assigned_employee,
            'priority', cnt.priority,
            'due_date', cnt.due_date,
            'dueDate', cnt.due_date,
            'stage', cnt.stage,
            'created_at', cnt.created_at
        ) ORDER BY cnt.id DESC
    )
    INTO v_content
    FROM public.content cnt
    LEFT JOIN public.clients c ON c.id = cnt.client_id
    WHERE cnt.tenant_id = v_tenant_id
      AND cnt.is_active = true
      AND (p_client_id IS NULL OR cnt.client_id = p_client_id)
      AND (p_stage IS NULL OR p_stage = 'ALL' OR cnt.stage = p_stage)
      AND (p_platform IS NULL OR p_platform = 'ALL' OR cnt.platform = p_platform)
      AND (p_search IS NULL OR cnt.title ILIKE '%' || p_search || '%' OR cnt.description ILIKE '%' || p_search || '%');

    RETURN public.fn_response_success(COALESCE(v_content, '[]'::jsonb), NULL, 'Content pipeline retrieved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_content_list', SQLSTATE, 'Failed to fetch content', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_content_upsert
CREATE OR REPLACE FUNCTION public.fn_content_upsert(
    p_id INTEGER DEFAULT NULL,
    p_client_id INTEGER DEFAULT NULL,
    p_code TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_content_type TEXT DEFAULT NULL,
    p_platform TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_assigned_employee TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'Medium',
    p_due_date DATE DEFAULT NULL,
    p_stage TEXT DEFAULT 'idea',
    p_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
    v_code TEXT;
    v_item JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_content_upsert');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_content_upsert', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;
    v_code := COALESCE(p_code, 'CNT-' || floor(random() * 9000 + 1000)::text);

    IF p_id IS NOT NULL THEN
        UPDATE public.content
        SET client_id = COALESCE(p_client_id, client_id),
            title = COALESCE(p_title, title),
            content_type = COALESCE(p_content_type, content_type),
            platform = COALESCE(p_platform, platform),
            description = COALESCE(p_description, description),
            assigned_employee = COALESCE(p_assigned_employee, assigned_employee),
            priority = COALESCE(p_priority, priority),
            due_date = COALESCE(p_due_date, due_date),
            stage = COALESCE(p_stage, stage),
            data = COALESCE(p_data, data),
            updated_by = v_profile_id,
            updated_at = now()
        WHERE id = p_id AND tenant_id = v_tenant_id
        RETURNING to_jsonb(content.*) INTO v_item;
    ELSE
        INSERT INTO public.content (
            client_id, code, title, content_type, platform, description,
            assigned_employee, priority, due_date, stage, data,
            tenant_id, created_by, updated_by
        ) VALUES (
            p_client_id, v_code, p_title, p_content_type, p_platform, p_description,
            p_assigned_employee, p_priority, p_due_date, p_stage, p_data,
            v_tenant_id, v_profile_id, v_profile_id
        )
        RETURNING to_jsonb(content.*) INTO v_item;
    END IF;

    RETURN public.fn_response_success(v_item, NULL, 'Content item saved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_content_upsert', SQLSTATE, 'Failed to save content', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_content_stage_update
CREATE OR REPLACE FUNCTION public.fn_content_stage_update(
    p_id INTEGER,
    p_stage TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
BEGIN
    v_ctx := public.fn_get_request_context('fn_content_stage_update');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_content_stage_update', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;

    UPDATE public.content
    SET stage = p_stage, updated_by = v_profile_id, updated_at = now()
    WHERE id = p_id AND tenant_id = v_tenant_id;

    RETURN public.fn_response_success(jsonb_build_object('id', p_id, 'stage', p_stage), NULL, 'Stage updated');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_content_stage_update', SQLSTATE, 'Failed to update stage', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_content_delete
CREATE OR REPLACE FUNCTION public.fn_content_delete(
    p_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
BEGIN
    v_ctx := public.fn_get_request_context('fn_content_delete');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_content_delete', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;

    UPDATE public.content
    SET is_active = false, updated_by = v_profile_id, updated_at = now()
    WHERE id = p_id AND tenant_id = v_tenant_id;

    RETURN public.fn_response_success(jsonb_build_object('id', p_id), NULL, 'Content deleted successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_content_delete', SQLSTATE, 'Failed to delete content', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- ==============================================================================
-- MODULE 4: TASKS
-- ==============================================================================

-- fn_tasks_list
CREATE OR REPLACE FUNCTION public.fn_tasks_list(
    p_client_id INTEGER DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_assigned_employee TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_tasks JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_tasks_list');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_tasks_list', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'client_id', t.client_id,
            'client', COALESCE(c.company, c.name, 'Internal'),
            'code', t.code,
            'title', t.title,
            'description', t.description,
            'assigned_employee', t.assigned_employee,
            'assignedEmployee', t.assigned_employee,
            'priority', t.priority,
            'status', t.status,
            'due_date', t.due_date,
            'dueDate', t.due_date,
            'created_at', t.created_at
        ) ORDER BY t.id DESC
    )
    INTO v_tasks
    FROM public.tasks t
    LEFT JOIN public.clients c ON c.id = t.client_id
    WHERE t.tenant_id = v_tenant_id
      AND t.is_active = true
      AND (p_client_id IS NULL OR t.client_id = p_client_id)
      AND (p_status IS NULL OR p_status = 'ALL' OR t.status = p_status)
      AND (p_assigned_employee IS NULL OR t.assigned_employee = p_assigned_employee)
      AND (p_search IS NULL OR t.title ILIKE '%' || p_search || '%');

    RETURN public.fn_response_success(COALESCE(v_tasks, '[]'::jsonb), NULL, 'Tasks retrieved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_tasks_list', SQLSTATE, 'Failed to fetch tasks', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_task_upsert
CREATE OR REPLACE FUNCTION public.fn_task_upsert(
    p_id INTEGER DEFAULT NULL,
    p_client_id INTEGER DEFAULT NULL,
    p_code TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_assigned_employee TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'Medium',
    p_status TEXT DEFAULT 'To Do',
    p_due_date DATE DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
    v_code TEXT;
    v_task JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_task_upsert');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_task_upsert', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;
    v_code := COALESCE(p_code, 'TSK-' || floor(random() * 9000 + 1000)::text);

    IF p_id IS NOT NULL THEN
        UPDATE public.tasks
        SET client_id = COALESCE(p_client_id, client_id),
            title = COALESCE(p_title, title),
            description = COALESCE(p_description, description),
            assigned_employee = COALESCE(p_assigned_employee, assigned_employee),
            priority = COALESCE(p_priority, priority),
            status = COALESCE(p_status, status),
            due_date = COALESCE(p_due_date, due_date),
            data = COALESCE(p_data, data),
            updated_by = v_profile_id,
            updated_at = now()
        WHERE id = p_id AND tenant_id = v_tenant_id
        RETURNING to_jsonb(tasks.*) INTO v_task;
    ELSE
        INSERT INTO public.tasks (
            client_id, code, title, description, assigned_employee, priority,
            status, due_date, data, tenant_id, created_by, updated_by
        ) VALUES (
            p_client_id, v_code, p_title, p_description, p_assigned_employee, p_priority,
            p_status, p_due_date, p_data, v_tenant_id, v_profile_id, v_profile_id
        )
        RETURNING to_jsonb(tasks.*) INTO v_task;
    END IF;

    RETURN public.fn_response_success(v_task, NULL, 'Task saved successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_task_upsert', SQLSTATE, 'Failed to save task', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_task_status_update
CREATE OR REPLACE FUNCTION public.fn_task_status_update(
    p_id INTEGER,
    p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
BEGIN
    v_ctx := public.fn_get_request_context('fn_task_status_update');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_task_status_update', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;

    UPDATE public.tasks
    SET status = p_status, updated_by = v_profile_id, updated_at = now()
    WHERE id = p_id AND tenant_id = v_tenant_id;

    RETURN public.fn_response_success(jsonb_build_object('id', p_id, 'status', p_status), NULL, 'Task status updated');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_task_status_update', SQLSTATE, 'Failed to update task status', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_task_delete
CREATE OR REPLACE FUNCTION public.fn_task_delete(
    p_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
BEGIN
    v_ctx := public.fn_get_request_context('fn_task_delete');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_task_delete', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;

    UPDATE public.tasks
    SET is_active = false, updated_by = v_profile_id, updated_at = now()
    WHERE id = p_id AND tenant_id = v_tenant_id;

    RETURN public.fn_response_success(jsonb_build_object('id', p_id), NULL, 'Task deleted successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_task_delete', SQLSTATE, 'Failed to delete task', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- ==============================================================================
-- MODULE 5: TEAM & PROFILES
-- ==============================================================================

-- fn_team_list
CREATE OR REPLACE FUNCTION public.fn_team_list(
    p_search TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_team JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_team_list');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_team_list', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.full_name, p.email),
            'full_name', p.full_name,
            'email', p.email,
            'role', p.role,
            'department', p.department,
            'phone', p.phone,
            'status', p.status,
            'avatar_url', p.avatar_url,
            'created_at', p.created_at
        ) ORDER BY p.id ASC
    )
    INTO v_team
    FROM public.profiles p
    WHERE p.tenant_id = v_tenant_id
      AND p.is_active = true
      AND (p_department IS NULL OR p_department = 'ALL' OR p.department = p_department)
      AND (p_status IS NULL OR p_status = 'ALL' OR p.status = p_status)
      AND (p_search IS NULL OR p.full_name ILIKE '%' || p_search || '%' OR p.email ILIKE '%' || p_search || '%');

    RETURN public.fn_response_success(COALESCE(v_team, '[]'::jsonb), NULL, 'Team members retrieved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_team_list', SQLSTATE, 'Failed to fetch team members', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_team_member_upsert
CREATE OR REPLACE FUNCTION public.fn_team_member_upsert(
    p_id INTEGER DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'content creator',
    p_department TEXT DEFAULT 'General',
    p_phone TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'Active',
    p_password TEXT DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
    v_member JSONB;
    v_new_uuid UUID;
BEGIN
    v_ctx := public.fn_get_request_context('fn_team_member_upsert');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_team_member_upsert', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;

    IF p_id IS NOT NULL THEN
        UPDATE public.profiles
        SET full_name = COALESCE(p_full_name, full_name),
            email = COALESCE(p_email, email),
            role = COALESCE(p_role, role),
            department = COALESCE(p_department, department),
            phone = COALESCE(p_phone, phone),
            status = COALESCE(p_status, status),
            password = COALESCE(p_password, password),
            data = COALESCE(p_data, data),
            updated_by = v_profile_id,
            updated_at = now()
        WHERE id = p_id AND tenant_id = v_tenant_id
        RETURNING to_jsonb(profiles.*) INTO v_member;
    ELSE
        v_new_uuid := gen_random_uuid();
        INSERT INTO public.profiles (
            user_id, email, full_name, role, department, phone, status,
            password, data, tenant_id, created_by, updated_by
        ) VALUES (
            v_new_uuid, p_email, p_full_name, p_role, p_department, p_phone, p_status,
            p_password, p_data, v_tenant_id, v_profile_id, v_profile_id
        )
        RETURNING to_jsonb(profiles.*) INTO v_member;
    END IF;

    RETURN public.fn_response_success(v_member, NULL, 'Team member saved successfully');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_team_member_upsert', SQLSTATE, 'Failed to save team member', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- fn_team_member_delete
CREATE OR REPLACE FUNCTION public.fn_team_member_delete(
    p_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_tenant_id INTEGER;
    v_profile_id INTEGER;
BEGIN
    v_ctx := public.fn_get_request_context('fn_team_member_delete');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_team_member_delete', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_tenant_id := (v_ctx->>'tenant_id')::INTEGER;
    v_profile_id := (v_ctx->>'profile_id')::INTEGER;

    UPDATE public.profiles
    SET is_active = false, updated_by = v_profile_id, updated_at = now()
    WHERE id = p_id AND tenant_id = v_tenant_id;

    RETURN public.fn_response_success(jsonb_build_object('id', p_id), NULL, 'Team member deactivated');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_team_member_delete', SQLSTATE, 'Failed to deactivate team member', 500, SQLERRM, NULL, v_ctx);
END;
$$;
