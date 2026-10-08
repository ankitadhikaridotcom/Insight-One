-- ==============================================================================
-- 01_initial_seed.sql
-- Insight One Seed Data: Tenant, Agency, 5 Core Roles, Scopes, Menus & Profiles
-- ==============================================================================

-- 1. Default Tenant
INSERT INTO public.tenants (id, name, slug, plan)
VALUES (1, 'Insight One Enterprise', 'insight-one-enterprise', 'Enterprise')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, plan = EXCLUDED.plan;

SELECT setval(pg_get_serial_sequence('public.tenants', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.tenants));

-- 2. Initial Default Profiles (Pre-seeded so agencies/tables can reference created_by = 1)
INSERT INTO public.profiles (
    id, user_id, email, full_name, role, department, phone, status, password, tenant_id, created_by
)
VALUES
    (1, '00000000-0000-0000-0000-000000000001'::uuid, 'admin@insightone.com', 'Admin User', 'Tenant Admin', 'Executive', '+1 (555) 019-2831', 'Active', 'Admin@123', 1, 1),
    (2, '00000000-0000-0000-0000-000000000002'::uuid, 'creator@insightone.com', 'Content Producer', 'content creator', 'Content', '+1 (555) 014-9923', 'Active', 'Creator@123', 1, 1),
    (3, '00000000-0000-0000-0000-000000000003'::uuid, 'approver@insightone.com', 'Content Approver', 'content approver', 'Editorial', '+1 (555) 392-1049', 'Active', 'Approver@123', 1, 1),
    (4, '00000000-0000-0000-0000-000000000004'::uuid, 'viewer@insightone.com', 'Client Observer', 'Viewer', 'Client Success', '+1 (555) 481-9920', 'Active', 'Viewer@123', 1, 1),
    (5, '00000000-0000-0000-0000-000000000005'::uuid, 'employee@insightone.com', 'Employee User', 'content creator', 'Operations', '+1 (555) 998-1122', 'Active', 'Employee@123', 1, 1)
ON CONFLICT (email) DO UPDATE SET 
    role = EXCLUDED.role,
    tenant_id = EXCLUDED.tenant_id;

SELECT setval(pg_get_serial_sequence('public.profiles', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.profiles));

-- 3. Default Agency
INSERT INTO public.agencies (id, tenant_id, code, name, description, created_by)
VALUES (1, 1, 'AG-01', 'Primary Growth Agency', 'Core operational agency managing enterprise clients', 1)
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.agencies', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.agencies));

-- 4. The 5 Core Roles
INSERT INTO public.roles (id, name, display_name, description)
VALUES
    (1, 'Role Host', 'Platform Host', 'Global Super Admin with complete platform control across all tenants'),
    (2, 'Tenant Admin', 'Tenant Administrator', 'Enterprise administrator with full control over agency workspaces and team settings'),
    (3, 'content creator', 'Content Creator', 'Produces content drafts, tasks, creative assets, and project milestones'),
    (4, 'content approver', 'Content Approver', 'Reviews deliverables, validates client expectations, and approves publishing schedules'),
    (5, 'Viewer', 'Viewer', 'Read-only stakeholder with access to analytics, calendar, and reports')
ON CONFLICT (name) DO UPDATE SET 
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

SELECT setval(pg_get_serial_sequence('public.roles', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.roles));

-- 5. System Scopes
INSERT INTO public.scopes (code, module, description)
VALUES
    ('*', 'system', 'Full platform-wide root access'),
    ('tenant.manage', 'tenants', 'Manage tenant settings and agency configurations'),
    ('tenant.audit', 'tenants', 'View audit and error logs'),
    ('agency.manage', 'agencies', 'Create and configure agencies'),
    ('team.read', 'team', 'View team member directory'),
    ('team.create', 'team', 'Invite and register team members'),
    ('team.update', 'team', 'Update team profiles and credentials'),
    ('team.delete', 'team', 'Deactivate team member access'),
    ('client.read', 'clients', 'View client accounts and portfolios'),
    ('client.create', 'clients', 'Create client records'),
    ('client.update', 'clients', 'Update client contracts and details'),
    ('client.delete', 'clients', 'Deactivate client records'),
    ('social.manage', 'social', 'Manage client social media channels'),
    ('project.read', 'projects', 'View project pipelines and Kanban boards'),
    ('project.create', 'projects', 'Create projects and milestones'),
    ('project.update', 'projects', 'Update project progress and statuses'),
    ('project.delete', 'projects', 'Delete projects'),
    ('task.read', 'tasks', 'View assigned tasks'),
    ('task.create', 'tasks', 'Create tasks for team'),
    ('task.update', 'tasks', 'Update task statuses and assignments'),
    ('task.delete', 'tasks', 'Delete tasks'),
    ('content.read', 'content', 'View content pipeline and calendar'),
    ('content.create', 'content', 'Draft content and headlines'),
    ('content.update', 'content', 'Edit content copy and schedules'),
    ('content.review', 'content', 'Submit and review content internally'),
    ('content.approve', 'content', 'Issue formal editorial and client approvals'),
    ('content.publish', 'content', 'Publish content deliverables'),
    ('content.delete', 'content', 'Delete content items'),
    ('analytics.read', 'analytics', 'View social analytics and engagement metrics'),
    ('networking.manage', 'networking', 'Manage outreach relationships and follow-ups'),
    ('reports.generate', 'reports', 'Generate and export client performance reports')
ON CONFLICT (code) DO NOTHING;

-- 6. Role Scopes (Mappings for each role)

-- Role Host: Wildcard '*'
INSERT INTO public.role_scopes (role_id, scope_id)
SELECT 1, s.id FROM public.scopes s WHERE s.code = '*'
ON CONFLICT DO NOTHING;

-- Tenant Admin: All management scopes
INSERT INTO public.role_scopes (role_id, scope_id)
SELECT 2, s.id FROM public.scopes s
WHERE s.code IN (
    'tenant.manage', 'agency.manage', 'team.read', 'team.create', 'team.update', 'team.delete',
    'client.read', 'client.create', 'client.update', 'client.delete', 'social.manage',
    'project.read', 'project.create', 'project.update', 'project.delete',
    'task.read', 'task.create', 'task.update', 'task.delete',
    'content.read', 'content.create', 'content.update', 'content.review', 'content.approve', 'content.publish', 'content.delete',
    'analytics.read', 'networking.manage', 'reports.generate'
)
ON CONFLICT DO NOTHING;

-- content creator: operational creation scopes
INSERT INTO public.role_scopes (role_id, scope_id)
SELECT 3, s.id FROM public.scopes s
WHERE s.code IN (
    'client.read', 'project.read', 'project.update',
    'task.read', 'task.create', 'task.update',
    'content.read', 'content.create', 'content.update',
    'analytics.read'
)
ON CONFLICT DO NOTHING;

-- content approver: review, approval, sign-off and publishing scopes
INSERT INTO public.role_scopes (role_id, scope_id)
SELECT 4, s.id FROM public.scopes s
WHERE s.code IN (
    'client.read', 'client.update', 'social.manage',
    'project.read', 'project.update',
    'task.read', 'task.create', 'task.update',
    'content.read', 'content.create', 'content.update', 'content.review', 'content.approve', 'content.publish',
    'analytics.read', 'networking.manage', 'reports.generate'
)
ON CONFLICT DO NOTHING;

-- Viewer: strictly read-only scopes
INSERT INTO public.role_scopes (role_id, scope_id)
SELECT 5, s.id FROM public.scopes s
WHERE s.code IN (
    'client.read', 'project.read', 'task.read', 'content.read', 'analytics.read'
)
ON CONFLICT DO NOTHING;

-- 7. Role Menu Items (Sidebar menus per role - Settings & Logout removed from main list)

-- Role Host & Tenant Admin menus
INSERT INTO public.role_menu_items (role_id, label, href, icon, display_order)
VALUES
    (1, 'Dashboard', '/dashboard', '▣', 1),
    (1, 'Team', '/team', '👥', 2),
    (1, 'Clients', '/clients', '◎', 3),
    (1, 'Projects', '/projects', '📁', 4),
    (1, 'Content', '/content', '✦', 5),
    (1, 'Tasks', '/tasks', '✓', 6),
    (1, 'Networking', '/networking', '◌', 7),
    (1, 'Engagement', '/engagement', '◔', 8),
    (1, 'Calendar', '/calendar', '◫', 9),
    (1, 'Statistics', '/statistics', '▤', 10),
    (1, 'Reports', '/reports', '▥', 11),

    (2, 'Dashboard', '/dashboard', '▣', 1),
    (2, 'Team', '/team', '👥', 2),
    (2, 'Clients', '/clients', '◎', 3),
    (2, 'Projects', '/projects', '📁', 4),
    (2, 'Content', '/content', '✦', 5),
    (2, 'Tasks', '/tasks', '✓', 6),
    (2, 'Networking', '/networking', '◌', 7),
    (2, 'Engagement', '/engagement', '◔', 8),
    (2, 'Calendar', '/calendar', '◫', 9),
    (2, 'Statistics', '/statistics', '▤', 10),
    (2, 'Reports', '/reports', '▥', 11)
ON CONFLICT DO NOTHING;

-- content creator menu
INSERT INTO public.role_menu_items (role_id, label, href, icon, display_order)
VALUES
    (3, 'Dashboard', '/dashboard', '▣', 1),
    (3, 'Projects', '/projects', '📁', 2),
    (3, 'Content', '/content', '✦', 3),
    (3, 'Tasks', '/tasks', '✓', 4),
    (3, 'Calendar', '/calendar', '◫', 5),
    (3, 'Engagement', '/engagement', '◔', 6)
ON CONFLICT DO NOTHING;

-- content approver menu
INSERT INTO public.role_menu_items (role_id, label, href, icon, display_order)
VALUES
    (4, 'Dashboard', '/dashboard', '▣', 1),
    (4, 'Clients', '/clients', '◎', 2),
    (4, 'Projects', '/projects', '📁', 3),
    (4, 'Content', '/content', '✦', 4),
    (4, 'Tasks', '/tasks', '✓', 5),
    (4, 'Calendar', '/calendar', '◫', 6),
    (4, 'Engagement', '/engagement', '◔', 7),
    (4, 'Networking', '/networking', '◌', 8),
    (4, 'Reports', '/reports', '▥', 9)
ON CONFLICT DO NOTHING;

-- Viewer menu
INSERT INTO public.role_menu_items (role_id, label, href, icon, display_order)
VALUES
    (5, 'Dashboard', '/dashboard', '▣', 1),
    (5, 'Projects', '/projects', '📁', 2),
    (5, 'Calendar', '/calendar', '◫', 3),
    (5, 'Statistics', '/statistics', '▤', 4)
ON CONFLICT DO NOTHING;
