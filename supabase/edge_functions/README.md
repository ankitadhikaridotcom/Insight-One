# Supabase Edge Functions Guidelines

This directory contains Supabase Edge Functions (built with Deno and TypeScript) used for asynchronous processing, third-party integrations, and automated background tasks in **Insight One**.

---

## 🏗️ Architecture & Standards

1. **Deno Runtime**:
   Edge functions run on the Deno runtime with native TypeScript support.
2. **Multi-Tenancy Context**:
   Edge functions must always extract the tenant identifier from the caller JWT or pass the `tenant_id` explicitly when invoked by background crons.
3. **Database Communication**:
   Edge functions must invoke PostgreSQL functions (`supabase.rpc(...)`) using `SECURITY DEFINER` semantics or the `SUPABASE_SERVICE_ROLE_KEY`. Never execute raw SQL queries inside Edge Functions.
4. **Standard Response Envelope**:
   Edge functions should return JSON payloads matching the platform's envelope standard:
   ```json
   {
     "is_success": true,
     "data": { ... },
     "paging": { "total_records": 0, "page_size": 0, "page_index": 0 },
     "message": "Task completed successfully",
     "status_code": 200
   }
   ```

---

## 🚀 Deployment Instructions

```bash
# Login to Supabase CLI
supabase login

# Deploy a specific edge function
supabase functions deploy analytics-aggregator --project-ref your-project-ref

# Set secrets for external APIs if needed
supabase secrets set SOCIAL_API_KEY="your-api-key" --project-ref your-project-ref
```
