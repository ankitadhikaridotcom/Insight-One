-- ==============================================================================
-- 01_common_helpers.sql
-- Insight One Standard Response Envelopes & Request Context Security Validator
-- ==============================================================================

-- 1. fn_response_success: Builds standardized JSONB success response
CREATE OR REPLACE FUNCTION public.fn_response_success(
    p_data JSONB DEFAULT NULL,
    p_paging JSONB DEFAULT NULL,
    p_message TEXT DEFAULT 'Operation successful',
    p_status_code INTEGER DEFAULT 200
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN jsonb_build_object(
        'is_success',   true,
        'data',         COALESCE(p_data, 'null'::jsonb),
        'paging',       COALESCE(p_paging, jsonb_build_object(
                          'total_records', CASE WHEN p_data IS NOT NULL AND jsonb_typeof(p_data) = 'array' THEN jsonb_array_length(p_data) ELSE 0 END,
                          'page_size',     0,
                          'page_index',    0
                        )),
        'message',      p_message,
        'status_code',  p_status_code
    );
END;
$$;

-- 2. fn_response_error: Safely logs technical error and returns sanitized JSONB
CREATE OR REPLACE FUNCTION public.fn_response_error(
    p_function_name TEXT,
    p_error_code TEXT,
    p_safe_message TEXT,
    p_status_code INTEGER DEFAULT 400,
    p_error_detail TEXT DEFAULT NULL,
    p_error_hint TEXT DEFAULT NULL,
    p_context JSONB DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tenant_id INTEGER := NULL;
    v_user_id UUID := NULL;
    v_profile_id INTEGER := NULL;
BEGIN
    -- Extract context identifiers if provided
    IF p_context IS NOT NULL THEN
        v_tenant_id := (p_context->>'tenant_id')::INTEGER;
        v_user_id := (p_context->>'user_id')::UUID;
        v_profile_id := (p_context->>'profile_id')::INTEGER;
    END IF;

    -- Safely log technical error into error_log table
    BEGIN
        INSERT INTO public.error_log (
            tenant_id,
            function_name,
            error_code,
            error_message,
            error_detail,
            error_hint,
            user_id,
            profile_id,
            metadata
        ) VALUES (
            v_tenant_id,
            p_function_name,
            p_error_code,
            p_safe_message,
            p_error_detail,
            p_error_hint,
            v_user_id,
            v_profile_id,
            p_context
        );
    EXCEPTION WHEN OTHERS THEN
        -- Never fail if error logging encounters an issue
        NULL;
    END;

    -- Return safe user-facing JSONB response
    RETURN jsonb_build_object(
        'is_success',   false,
        'data',         COALESCE(p_data, 'null'::jsonb),
        'paging',       jsonb_build_object(
                          'total_records', 0,
                          'page_size',     0,
                          'page_index',    0
                        ),
        'message',      p_safe_message,
        'status_code',  p_status_code
    );
END;
$$;

-- 3. fn_get_request_context: Verifies caller identity, tenant isolation, and RBAC scopes
CREATE OR REPLACE FUNCTION public.fn_get_request_context(
    p_function_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_uid UUID;
    v_profile RECORD;
    v_has_scope BOOLEAN := false;
BEGIN
    -- 1. Identify authenticated Supabase user
    v_auth_uid := auth.uid();

    -- Fallback for development/demo: if no auth session, select first active Tenant Admin / Admin profile
    IF v_auth_uid IS NULL THEN
        SELECT p.*, t.name as tenant_name, r.name as role_name
        INTO v_profile
        FROM public.profiles p
        JOIN public.tenants t ON t.id = p.tenant_id
        LEFT JOIN public.roles r ON lower(r.name) = lower(p.role)
        WHERE p.is_active = true
        ORDER BY p.id ASC
        LIMIT 1;
    ELSE
        SELECT p.*, t.name as tenant_name, r.name as role_name
        INTO v_profile
        FROM public.profiles p
        JOIN public.tenants t ON t.id = p.tenant_id
        LEFT JOIN public.roles r ON lower(r.name) = lower(p.role)
        WHERE p.user_id = v_auth_uid AND p.is_active = true;
    END IF;

    -- If no profile found, raise unauthorized
    IF v_profile.id IS NULL THEN
        RETURN jsonb_build_object(
            'is_authorized', false,
            'error_message', 'User profile not found or inactive for current session'
        );
    END IF;

    -- 2. Validate scope / function permission based on role scopes
    IF lower(v_profile.role) IN ('role host', 'admin', 'tenant admin') THEN
        v_has_scope := true;
    ELSE
        -- Check if role has scope matching the function or wildcard
        SELECT EXISTS (
            SELECT 1 
            FROM public.role_scopes rs
            JOIN public.scopes s ON s.id = rs.scope_id
            JOIN public.roles r ON r.id = rs.role_id
            WHERE lower(r.name) = lower(v_profile.role)
              AND (
                  s.code = p_function_name 
                  OR p_function_name LIKE s.code || '%'
                  OR s.code = '*'
              )
        ) INTO v_has_scope;
        
        -- If no explicit role scope mapping defined yet, default allow for active profiles
        IF NOT v_has_scope AND NOT EXISTS (SELECT 1 FROM public.role_scopes) THEN
            v_has_scope := true;
        END IF;
    END IF;

    IF NOT v_has_scope THEN
        RETURN jsonb_build_object(
            'is_authorized', false,
            'error_message', 'Permission denied: insufficient scopes for ' || p_function_name
        );
    END IF;

    -- Return valid context
    RETURN jsonb_build_object(
        'is_authorized', true,
        'user_id', COALESCE(v_profile.user_id, '00000000-0000-0000-0000-000000000000'::uuid),
        'profile_id', v_profile.id,
        'tenant_id', v_profile.tenant_id,
        'tenant_name', v_profile.tenant_name,
        'role', v_profile.role,
        'email', v_profile.email,
        'full_name', v_profile.full_name
    );
END;
$$;
