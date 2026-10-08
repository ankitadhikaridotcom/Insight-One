-- ==============================================================================
-- 02_auth_and_navigation.sql
-- Insight One Authentication State, Navigation & Permissions Functions
-- ==============================================================================

-- 1. fn_navigation_menu: Returns role-configured sidebar navigation items
CREATE OR REPLACE FUNCTION public.fn_navigation_menu()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_role_name TEXT;
    v_items JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_navigation_menu');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_navigation_menu', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    v_role_name := lower(v_ctx->>'role');

    -- Select items configured in role_menu_items table
    SELECT jsonb_agg(
        jsonb_build_object(
            'label', mi.label,
            'href', mi.href,
            'icon', mi.icon,
            'display_order', mi.display_order
        ) ORDER BY mi.display_order ASC
    )
    INTO v_items
    FROM public.role_menu_items mi
    JOIN public.roles r ON r.id = mi.role_id
    WHERE lower(r.name) = v_role_name AND mi.is_active = true;

    RETURN public.fn_response_success(COALESCE(v_items, '[]'::jsonb), NULL, 'Menu items retrieved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_navigation_menu', SQLSTATE, 'Failed to fetch navigation items', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- 2. fn_user_me: Returns currently authenticated profile and tenant context
CREATE OR REPLACE FUNCTION public.fn_user_me()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_profile JSONB;
    v_scopes JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_user_me');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_user_me', 'UNAUTHORIZED', v_ctx->>'error_message', 401, NULL, NULL, v_ctx);
    END IF;

    -- Query profile data
    SELECT jsonb_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'email', p.email,
        'full_name', p.full_name,
        'phone', p.phone,
        'avatar_url', p.avatar_url,
        'role', p.role,
        'department', p.department,
        'status', p.status,
        'tenant_id', p.tenant_id,
        'tenant_name', t.name,
        'tenant_slug', t.slug,
        'created_at', p.created_at
    )
    INTO v_profile
    FROM public.profiles p
    JOIN public.tenants t ON t.id = p.tenant_id
    WHERE p.id = (v_ctx->>'profile_id')::INTEGER;

    -- Aggregate scopes for active role
    SELECT jsonb_agg(s.code)
    INTO v_scopes
    FROM public.role_scopes rs
    JOIN public.scopes s ON s.id = rs.scope_id
    JOIN public.roles r ON r.id = rs.role_id
    WHERE lower(r.name) = lower(v_ctx->>'role');

    v_profile := jsonb_set(v_profile, '{scopes}', COALESCE(v_scopes, '[]'::jsonb));

    RETURN public.fn_response_success(v_profile, NULL, 'User context retrieved');
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_user_me', SQLSTATE, 'Failed to fetch user context', 500, SQLERRM, NULL, v_ctx);
END;
$$;

-- 3. fn_role_permissions: Lists scopes and menu configurations for a specified role
CREATE OR REPLACE FUNCTION public.fn_role_permissions(
    p_role_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ctx JSONB;
    v_scopes JSONB;
    v_menus JSONB;
BEGIN
    v_ctx := public.fn_get_request_context('fn_role_permissions');
    IF NOT (v_ctx->>'is_authorized')::BOOLEAN THEN
        RETURN public.fn_response_error('fn_role_permissions', 'UNAUTHORIZED', v_ctx->>'error_message', 403, NULL, NULL, v_ctx);
    END IF;

    -- Get scopes
    SELECT jsonb_agg(jsonb_build_object('code', s.code, 'module', s.module, 'description', s.description))
    INTO v_scopes
    FROM public.role_scopes rs
    JOIN public.scopes s ON s.id = rs.scope_id
    JOIN public.roles r ON r.id = rs.role_id
    WHERE lower(r.name) = lower(p_role_name);

    -- Get menus
    SELECT jsonb_agg(jsonb_build_object('label', mi.label, 'href', mi.href, 'icon', mi.icon, 'order', mi.display_order))
    INTO v_menus
    FROM public.role_menu_items mi
    JOIN public.roles r ON r.id = mi.role_id
    WHERE lower(r.name) = lower(p_role_name) AND mi.is_active = true;

    RETURN public.fn_response_success(
        jsonb_build_object(
            'role', p_role_name,
            'scopes', COALESCE(v_scopes, '[]'::jsonb),
            'menus', COALESCE(v_menus, '[]'::jsonb)
        ),
        NULL,
        'Role permissions retrieved'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN public.fn_response_error('fn_role_permissions', SQLSTATE, 'Failed to retrieve permissions', 500, SQLERRM, NULL, v_ctx);
END;
$$;
