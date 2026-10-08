# RPC Functions & Database API Reference

This document provides the reference catalog for all PostgreSQL stored procedures and `SECURITY DEFINER` RPC functions in **Insight One**.

---

## 1. Execution Standards & Security Definer Pattern

### Rules for All Database Functions:
1. **Explicit Security Definer**: Every function must be marked `SECURITY DEFINER` and include `SET search_path = public, pg_temp`.
2. **Standard Parameter Prefix**: All input parameters **must begin with `p_`** (e.g., `p_code`, `p_name`, `p_tenant_id`, `p_page_size`).
3. **Uniform Return Type**: Every function must return `JSONB`.
4. **Context & Scope Verification**: Every function executes `fn_get_request_context(p_function_name)` before querying or mutating data.
5. **Safe Error Sanitization**: Errors caught via exception blocks must pass to `fn_response_error(...)` which logs the raw exception in `error_log` and returns a clean, sanitized error message to the client.

---

## 2. Core Security & Response Helpers

### 2.1. `fn_response_success`
Constructs a standard successful JSONB envelope.
```sql
CREATE OR REPLACE FUNCTION public.fn_response_success(
    p_data JSONB DEFAULT NULL,
    p_paging JSONB DEFAULT NULL,
    p_message TEXT DEFAULT 'Operation successful',
    p_status_code INTEGER DEFAULT 200
)
RETURNS JSONB
```

**Output Structure**:
```json
{
  "is_success": true,
  "data": { ... },
  "paging": {
    "total_records": 10,
    "page_size": 10,
    "page_index": 0
  },
  "message": "Operation successful",
  "status_code": 200
}
```

---

### 2.2. `fn_response_error`
Safely logs raw PostgreSQL technical exceptions into `public.error_log` while returning a clean, uncompromised response to the client application.
```sql
CREATE OR REPLACE FUNCTION public.fn_response_error(
    p_function_name TEXT,
    p_error_code TEXT,
    p_safe_message TEXT,
    p_status_code INTEGER DEFAULT 400,
    p_error_detail TEXT DEFAULT NULL,
    p_error_hint TEXT DEFAULT NULL,
    p_context JSONB DEFAULT NULL
)
RETURNS JSONB
```

**Output Structure**:
```json
{
  "is_success": false,
  "data": null,
  "paging": {
    "total_records": 0,
    "page_size": 0,
    "page_index": 0
  },
  "message": "Permission denied: insufficient scopes",
  "status_code": 403
}
```

---

### 2.3. `fn_get_request_context`
Validates the current session (`auth.uid()`), retrieves the caller's tenant profile, checks role scopes against the requested function, and yields tenant context.
```sql
CREATE OR REPLACE FUNCTION public.fn_get_request_context(
    p_function_name TEXT
)
RETURNS JSONB
```

**Returned Object Keys**:
- `is_authorized`: `true` or `false`
- `error_message`: Diagnostic failure message (if not authorized)
- `user_id`: UUID of authenticated user
- `profile_id`: Integer ID of the matching `public.profiles` row
- `tenant_id`: Integer ID of the active tenant
- `tenant_name`: Name of the tenant organization
- `role`: Role string (e.g., `Tenant Admin`, `content creator`)
- `email`: Authenticated user email

---

## 3. Authentication & Navigation Functions

| Function Signature | Scopes Checked | Description |
| :--- | :--- | :--- |
| `fn_user_me()` | Authenticated | Retrieves current logged-in profile, tenant details, and role metadata. |
| `fn_navigation_menu()` | Authenticated | Returns ordered list of sidebar menu links permitted for the caller's role. |
| `fn_role_permissions(p_role_name TEXT)` | `*`, `tenant.manage` | Lists all scopes and menus granted to a given role. |

---

## 4. Business Domain RPC Catalog

All business operations execute through these functions. Direct table queries are forbidden in TypeScript.

### 4.1. Clients & Agencies
- `fn_clients_list(p_agency_id INTEGER, p_status TEXT, p_search TEXT, p_page_index INTEGER, p_page_size INTEGER)`
- `fn_client_get(p_id INTEGER)`
- `fn_client_upsert(p_id INTEGER, p_agency_id INTEGER, p_code TEXT, p_name TEXT, p_company TEXT, p_email TEXT, p_phone TEXT, p_website TEXT, p_industry TEXT, p_status TEXT, p_value TEXT, p_notes TEXT, p_data JSONB, p_metadata JSONB)`
- `fn_client_delete(p_id INTEGER)`
- `fn_agencies_list()`
- `fn_agency_upsert(p_id INTEGER, p_code TEXT, p_name TEXT, p_description TEXT)`
- `fn_social_profiles_list(p_client_id INTEGER)`
- `fn_social_profile_upsert(p_id INTEGER, p_client_id INTEGER, p_code TEXT, p_platform TEXT, p_handle TEXT, p_profile_url TEXT, p_followers_count INTEGER)`

### 4.2. Projects (Kanban Board)
- `fn_projects_list(p_client_id INTEGER, p_status TEXT, p_priority TEXT, p_search TEXT)`
- `fn_project_get(p_id INTEGER)`
- `fn_project_upsert(p_id INTEGER, p_client_id INTEGER, p_code TEXT, p_name TEXT, p_description TEXT, p_project_manager TEXT, p_assigned_team TEXT, p_start_date DATE, p_due_date DATE, p_priority TEXT, p_status TEXT, p_progress INTEGER, p_data JSONB)`
- `fn_project_status_update(p_id INTEGER, p_status TEXT)`: Optimized for instant Kanban column dragging.
- `fn_project_delete(p_id INTEGER)`

### 4.3. Content Pipeline
- `fn_content_list(p_client_id INTEGER, p_stage TEXT, p_platform TEXT, p_search TEXT)`
- `fn_content_upsert(p_id INTEGER, p_client_id INTEGER, p_code TEXT, p_title TEXT, p_content_type TEXT, p_platform TEXT, p_description TEXT, p_assigned_employee TEXT, p_priority TEXT, p_due_date DATE, p_stage TEXT, p_data JSONB)`
- `fn_content_stage_update(p_id INTEGER, p_stage TEXT)`: Instant stage promotion in Kanban view.
- `fn_content_delete(p_id INTEGER)`

### 4.4. Tasks
- `fn_tasks_list(p_client_id INTEGER, p_status TEXT, p_assigned_employee TEXT, p_search TEXT)`
- `fn_task_upsert(p_id INTEGER, p_client_id INTEGER, p_code TEXT, p_title TEXT, p_description TEXT, p_assigned_employee TEXT, p_priority TEXT, p_status TEXT, p_due_date DATE, p_data JSONB)`
- `fn_task_status_update(p_id INTEGER, p_status TEXT)`
- `fn_task_delete(p_id INTEGER)`

### 4.5. Team & User Administration
- `fn_team_list(p_search TEXT, p_department TEXT, p_status TEXT)`
- `fn_team_member_upsert(p_id INTEGER, p_email TEXT, p_full_name TEXT, p_role TEXT, p_department TEXT, p_phone TEXT, p_status TEXT, p_password TEXT, p_data JSONB)`
- `fn_team_member_delete(p_id INTEGER)`

### 4.6. Analytics, Networking, Calendar & Reports
- `fn_networking_list(p_search TEXT, p_status TEXT)`
- `fn_networking_upsert(p_id INTEGER, p_code TEXT, p_person_name TEXT, p_company TEXT, p_email TEXT, p_phone TEXT, p_networking_type TEXT, p_date DATE, p_status TEXT, p_notes TEXT, p_follow_up_date DATE)`
- `fn_engagement_list(p_client_id INTEGER, p_platform TEXT)`
- `fn_engagement_upsert(p_id INTEGER, p_client_id INTEGER, p_code TEXT, p_platform TEXT, p_date TEXT, p_likes INTEGER, p_comments INTEGER, p_shares INTEGER, p_reach INTEGER, p_impressions INTEGER, p_performance TEXT, p_notes TEXT)`
- `fn_calendar_events_list(p_client_id INTEGER, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)`
- `fn_calendar_event_upsert(p_id INTEGER, p_client_id INTEGER, p_code TEXT, p_title TEXT, p_description TEXT, p_event_type TEXT, p_start_time TIMESTAMPTZ, p_end_time TIMESTAMPTZ)`
- `fn_reports_list(p_client_id INTEGER)`
- `fn_report_create(p_client_id INTEGER, p_code TEXT, p_week_start DATE, p_week_end DATE, p_report_data JSONB)`
- `fn_report_delete(p_id INTEGER)`
