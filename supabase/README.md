# Supabase Architecture & Database Scripts

This directory contains the complete database scripts, table schemas, security definer stored functions, seed data, and edge functions for the **Insight One** platform.

---

## 📁 Directory Structure

```
supabase/
├── README.md                          # This deployment guide
├── full_schema.sql                    # Single-file master migration (run in Supabase SQL Editor)
│
├── schema/                            # DDL table creation scripts
│   ├── 01_core_multitenancy.sql       # Tenants, agencies, profiles, roles, scopes, error_log
│   └── 02_business_tables.sql         # Standardized business entities with 11 multi-tenancy columns
│
├── functions/                         # PostgreSQL stored functions & security definer RPCs
│   ├── 01_common_helpers.sql          # fn_response_success, fn_response_error, fn_get_request_context
│   ├── 02_auth_and_navigation.sql     # fn_user_me, fn_navigation_menu, fn_role_permissions
│   └── 03_business_rpc.sql            # CRUD RPC functions for clients, projects, tasks, etc.
│
├── seeds/                             # Initial configuration & seed data
│   └── 01_initial_seed.sql            # The 5 roles, granular scopes, menu mappings, and initial profiles
│
├── policies/                          # Security, RLS & permissions
│   └── 01_rls_and_permissions.sql     # Row Level Security and permission grants
│
└── edge_functions/                    # Deno / TypeScript Edge Functions
    ├── README.md                      # Guide to deploying Supabase Edge Functions
    └── analytics-aggregator/          # Reference Edge Function for background sync
        └── index.ts
```

---

## 🚀 How to Apply to Supabase

### Method 1: Supabase Web Console (Fastest)
1. Open your project dashboard at [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** tab on the left navigation.
3. Open [`full_schema.sql`](file:///d:/learningapp/supabase/full_schema.sql), copy its entire contents, and paste into the SQL Editor.
4. Click **Run**.
5. The complete multi-tenant schema, roles, scopes, security definer functions, and seed accounts will be initialized immediately.

### Method 2: Supabase CLI
```bash
# Link your local project to Supabase
supabase link --project-ref your-project-ref

# Apply the master schema
supabase db push
# or run via psql
psql -h aws-0-xxx.pooler.supabase.com -p 5432 -d postgres -U postgres.your-ref -f supabase/full_schema.sql
```

---

## 🔑 Default Seed Accounts

The migration initializes demo profiles across key roles:

| Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin@insightone.com` | `Admin@123` | **`Tenant Admin`** | Full workspace management and setup authority |
| `creator@insightone.com` | `Creator@123` | **`content creator`** | Produces content, media, and task deliverables |
| `approver@insightone.com` | `Approver@123` | **`content approver`** | Editorial review, client approvals, and schedule sign-off |
| `viewer@insightone.com` | `Viewer@123` | **`Viewer`** | Read-only analytics, reports, and calendar access |
